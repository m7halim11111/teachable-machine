import sys
import os
import torch
import torchvision.transforms as transforms
import torchvision
from PIL import Image
import sys
import os

# Add the path to the directory containing the 'models' folder
sys.path.append(os.path.abspath(r'C:\Users\eissa\OneDrive\Desktop\work\DEPI\Final Project\image enhance and upscalling'))
from pytorch_CycleGAN_and_pix2pix.models.networks import UnetGenerator
# Load the pre-trained Pix2Pix model
def load_pix2pix_model():
    """
    Load the pre-trained Pix2Pix model (U-Net architecture) and the weights.
    """
    try:
        # Define the U-Net generator model (input_nc=3, output_nc=3, ngf=64 for Pix2Pix)
        model = UnetGenerator(input_nc=3, output_nc=3, num_downs=8, ngf=64, norm_layer=torch.nn.BatchNorm2d, use_dropout=False)

        # Load the state dictionary (pre-trained weights)
        model_path = r'C:/Users/eissa/OneDrive/Desktop/work/DEPI/Final Project/image enhance and upscalling/pytorch-CycleGAN-and-pix2pix/checkpoints/edges2shoes_pretrained/latest_net_G.pth'
        state_dict = torch.load(model_path, map_location='cpu')

        # Load the weights into the model
        model.load_state_dict(state_dict)

        # Set the model to evaluation mode
        model.eval()
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

# Define image transformation
def transform_image(image):
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
    ])
    return transform(image).unsqueeze(0)

# Define the prediction function
def predict(input_image, model):
    input_tensor = transform_image(input_image)
    with torch.no_grad():
        output_tensor = model(input_tensor)
    output_image_path = 'output.png'
    torchvision.utils.save_image(output_tensor, output_image_path)
    return output_image_path
