from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from azure.cognitiveservices.vision.customvision.training import CustomVisionTrainingClient
from azure.cognitiveservices.vision.customvision.prediction import CustomVisionPredictionClient
from azure.cognitiveservices.vision.customvision.training.models import ImageFileCreateBatch, ImageFileCreateEntry
from msrest.authentication import ApiKeyCredentials
import time
from PIL import Image
import io
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import VisualFeatureTypes
from msrest.authentication import CognitiveServicesCredentials
import os
from dotenv import load_dotenv
import json
import logging
import tensorflow as tf
from flask_sqlalchemy import SQLAlchemy
from celery import Celery

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

app = Flask(__name__)
celery = Celery(app.name, broker='redis://localhost:6379/0')

# Database configuration
db_connection_string = os.getenv('DATABASE_URL')      #Server=tcp:teachable-machine-server.database.windows.net,1433;Initial Catalog=TeachableMachineDatabase;Persist Security Info=False;User ID=AhmedElgohary;Password=Ahmed1122@#;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
app.config['SQLALCHEMY_DATABASE_URI'] = db_connection_string
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define allowed origins
allowed_origins = [
    'http://localhost:5000',  # Local development
    'https://your-production-frontend-domain.com',  # Your production frontend
    'https://your-staging-frontend-domain.com'  # Your staging frontend (if applicable)
]

# Configure CORS
CORS(app, resources={r"/*": {"origins": allowed_origins}})  # Step 3: Ensure CORS is properly configured

# Replace hardcoded values with environment variables
ENDPOINT = os.getenv('AZURE_ENDPOINT')#https://teachablemachineclassificationimage.cognitiveservices.azure.com/
training_key = os.getenv('AZURE_TRAINING_KEY')#be58ac4e14b84837981559364c990836
prediction_key = os.getenv('AZURE_PREDICTION_KEY')#7bbcc15adea943918133a3c4154fabaa
prediction_resource_id = os.getenv('AZURE_PREDICTION_RESOURCE_ID')#/subscriptions/8bc31d28-80d3-46f8-8e99-b8d63833ee69/resourceGroups/TeachableMachine/providers/Microsoft.CognitiveServices/accounts/teachablemachineclassificationimage-Prediction
vision_key = os.getenv('AZURE_VISION_KEY')#4c755cac8e3142df96af17072f0a85ef
vision_endpoint = os.getenv('AZURE_VISION_ENDPOINT')#https://teachablemachineenhanceimage.cognitiveservices.azure.com/


credentials = ApiKeyCredentials(in_headers={"Training-key": training_key})
trainer = CustomVisionTrainingClient(ENDPOINT, credentials)

# Create Computer Vision client
computervision_client = ComputerVisionClient(vision_endpoint, CognitiveServicesCredentials(vision_key))

# Use environment variables for these paths
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'D:\\home\\site\\wwwroot\\uploads')
ENHANCED_FOLDER = os.getenv('ENHANCED_FOLDER', 'D:\\home\\site\\wwwroot\\enhanced')

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ENHANCED_FOLDER, exist_ok=True)

project = None
iteration = None
project_id, iteration_id = None, None

# Example model
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    project_id = db.Column(db.String(100), unique=True, nullable=False)
    iteration_id = db.Column(db.String(100), nullable=False)

@app.route('/health', methods=['GET'])
def health_check():
    # Step 2: Add a health check endpoint
    return jsonify({'status': 'OK', 'message': 'Server is running'}), 200

@app.before_request
def log_request_info():
    # Step 5: Add request logging
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())

@app.after_request
def log_response_info(response):
    # Step 5: Add response logging
    app.logger.debug('Response: %s', response.get_data())
    return response

@app.route('/upload', methods=['POST'])
def upload_images():
    files = request.files.getlist('files[]')
    for file in files:
        class_name = file.filename.split('_')[0]
        class_folder = os.path.join(UPLOAD_FOLDER, class_name)
        os.makedirs(class_folder, exist_ok=True)
        file.save(os.path.join(class_folder, file.filename))
    return jsonify({'message': 'Files uploaded successfully!'})

@app.route('/train', methods=['POST'])
def train_model():
    data = request.get_json()
    task = train_model_task.delay(data)
    return jsonify({'task_id': task.id}), 202

@celery.task
def train_model_task(data):
    global project, iteration, project_id, iteration_id

    classes = data['classes']
    enhance_images = data['enhance_images']
    epochs = data.get('epochs', 50)
    batch_size = data.get('batch_size', 32)
    learning_rate = data.get('learning_rate', 0.001)

    try:
        # Create a new Custom Vision project
        project = trainer.create_project("Image Classification Project")
        yield json.dumps({'status': 'Project created successfully'})

        # Get all domains
        domains = trainer.get_domains()

        # Choose the appropriate domain
        # Replace "General" with the domain name you want to use
        domain = next(domain for domain in domains if domain.name == "General")
        
        options = trainer.get_domain(domain.id)
        options.classification_type = "Multiclass"
        options.use_negative_set = False
        options.detection_algorithms = "Normal"
        options.train_parameters = {
            "epochs": epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate
        }

        # Create tags (classes) in the project
        tag_dict = {class_name: trainer.create_tag(project.id, class_name) for class_name in classes}
        yield json.dumps({'status': f'Created {len(classes)} tags: {", ".join(classes)}'})

        print("Processing and adding images...")
        image_list = []
        for class_name in classes:
            class_folder = os.path.join(UPLOAD_FOLDER, class_name)
            enhanced_class_folder = os.path.join(ENHANCED_FOLDER, class_name)
            os.makedirs(enhanced_class_folder, exist_ok=True)
            
            class_images = os.listdir(class_folder)
            yield json.dumps({'status': f'Processing {len(class_images)} images for class {class_name}'})
            
            for img_name in class_images:
                with open(os.path.join(class_folder, img_name), "rb") as image_file:
                    image_data = image_file.read()
                    
                    # If image enhancement is on, apply it here
                    if enhance_images == 'on':
                        image_data = apply_image_enhancement(image_data)
                        
                        # Save the enhanced image
                        enhanced_img_path = os.path.join(enhanced_class_folder, f"enhanced_{img_name}")
                        with open(enhanced_img_path, "wb") as enhanced_file:
                            enhanced_file.write(image_data)
                   
                    image_list.append(ImageFileCreateEntry(name=img_name, contents=image_data, tag_ids=[tag_dict[class_name].id]))

        total_images = len(image_list)
        for i in range(0, total_images, 64):
            batch = ImageFileCreateBatch(images=image_list[i:i+64])
            trainer.create_images_from_files(project.id, batch)
            yield json.dumps({'status': f'Uploaded {min(i+64, total_images)}/{total_images} images'})

        print("Training...")
        iteration = trainer.train_project(project.id, options=options)
        while (iteration.status != "Completed"):
            iteration = trainer.get_iteration(project.id, iteration.id)
            yield json.dumps({'status': f'Training status: {iteration.status}'})
            time.sleep(1)

        # Save project and iteration information
        project_id, iteration_id = project.id, iteration.id
        save_project_info(project_id, iteration_id)

        # Publish the iteration to the prediction endpoint
        trainer.publish_iteration(project.id, iteration.id, 'myModel', prediction_resource_id)
        yield json.dumps({'status': 'Model trained and published successfully!', 'project_id': project.id, 'iteration_id': iteration.id})
    except Exception as e:
        yield json.dumps({'error': str(e)})

def apply_image_enhancement(image_data):
    # Use Azure's Computer Vision API to enhance the image
    enhanced_image = computervision_client.generate_thumbnail_in_stream(1024, 1024, image_data)
    return enhanced_image.content

def save_project_info(project_id, iteration_id):
    project = Project(name="Image Classification Project", project_id=project_id, iteration_id=iteration_id)
    db.session.add(project)
    db.session.commit()

def load_project_info():
    project = Project.query.order_by(Project.id.desc()).first()
    if project:
        return project.project_id, project.iteration_id
    return None, None

# Add this line here
project_id, iteration_id = load_project_info()

@app.route('/predict', methods=['POST'])
def predict():
    global project_id, iteration_id
    if not project_id or not iteration_id:
        project_id, iteration_id = load_project_info()
        if not project_id or not iteration_id:
            return jsonify({'error': 'Model not trained yet'}), 400

    file = request.files['image']
    img_data = file.read()

    # Check if image enhancement was used during training
    enhance_images = request.form.get('enhance_images', 'off')

    # Apply enhancement if it was used during training
    if enhance_images == 'on':
        img_data = apply_image_enhancement(img_data)

    try:
        # Create prediction client
        prediction_credentials = ApiKeyCredentials(in_headers={"Prediction-key": prediction_key})
        predictor = CustomVisionPredictionClient(ENDPOINT, prediction_credentials)

        results = predictor.classify_image(project_id, iteration_id, img_data)

        predictions = [{'class': prediction.tag_name, 'confidence': prediction.probability * 100}
                       for prediction in results.predictions]

        return jsonify({'predictions': predictions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Suppress TensorFlow warnings
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)

    # Run in debug mode and make accessible on the network
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)