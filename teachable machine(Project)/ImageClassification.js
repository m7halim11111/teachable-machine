// Function to attach input event listeners for dynamically adjusting width
function attachWidthAdjustEvent(classCard) {
    const input = classCard.querySelector('.class-title');
    input.addEventListener('input', function() {
        this.style.width = 'auto'; // Reset width to auto
        this.style.width = (this.scrollWidth + 10) + 'px'; // Adjust width based on content
    });
}


// Function to attach file upload and preview event listeners
function attachUploadEvents(classCard) {
    const uploadButton = classCard.querySelector('.upload-button');
    const uploadInput = classCard.querySelector('.upload-input');
    const webcamButton = classCard.querySelector('.webcam-button');
    
    uploadButton.addEventListener('click', () => uploadInput.click());

    uploadInput.addEventListener('change', function() {
        handleImageSelection(Array.from(this.files), classCard);
    });

    if (webcamButton) {
        webcamButton.addEventListener('click', () => handleWebcamCapture(classCard));
    }
}

// Function to handle image selection (from file or webcam)
function handleImageSelection(files, classCard) {
    const imageContainer = classCard.querySelector('.image-preview-container') || document.createElement('div');
    imageContainer.classList.add('image-preview-container');
    
    files.forEach(file => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.classList.add('image-preview');
        imageContainer.appendChild(img);
    });
 
    const imageSamplesDiv = classCard.querySelector('.image-samples');
    imageSamplesDiv.innerHTML = `<p>${imageContainer.children.length} Image Samples</p>`;
    if (!classCard.contains(imageContainer)) {
        imageSamplesDiv.appendChild(imageContainer);
    }
}

let capturedImages = [];

// Function to capture multiple images from webcam
function captureImagesFromWebcam(classCard, count = 100) {
    return new Promise((resolve, reject) => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();

                let captureCount = 0;

                function captureFrame() {
                    if (captureCount >= count) {
                        stream.getTracks().forEach(track => track.stop());
                        resolve();
                        return;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0);

                    canvas.toBlob(blob => {
                        const file = new File([blob], `webcam-capture-${capturedImages.length + captureCount}.jpg`, { type: "image/jpeg" });
                        capturedImages.push(file);
                        captureCount++;

                        // Update progress
                        updateCaptureProgress(classCard, capturedImages.length, capturedImages.length + count - captureCount);

                        // Schedule next capture
                        setTimeout(captureFrame, 100); // Capture every 100ms
                    }, 'image/jpeg');
                }

                video.onloadeddata = captureFrame;
            })
            .catch(reject);
    });
}

// Function to update capture progress
function updateCaptureProgress(classCard, current, total) {
    const imageSamplesDiv = classCard.querySelector('.image-samples');
    imageSamplesDiv.innerHTML = `<p>Capturing: ${current}/${total}</p>`;
}

// Function to handle webcam button click
function handleWebcamCapture(classCard) {
    captureImagesFromWebcam(classCard)
        .then(() => {
            handleImageSelection(capturedImages, classCard);
            askForMoreSamples(classCard);
        })
        .catch(error => {
            console.error('Error capturing images:', error);
            alert('Failed to capture images. Please check your webcam permissions.');
        });
}

// Function to ask if user wants to capture more samples
function askForMoreSamples(classCard) {
    const moreSamplesDiv = document.createElement('div');
    moreSamplesDiv.innerHTML = `
        <p>Do you want to capture more samples?</p>
        <button class="yes-button">Yes</button>
        <button class="no-button">No</button>
    `;
    classCard.appendChild(moreSamplesDiv);

    moreSamplesDiv.querySelector('.yes-button').addEventListener('click', () => {
        moreSamplesDiv.remove();
        handleWebcamCapture(classCard);
    });

    moreSamplesDiv.querySelector('.no-button').addEventListener('click', () => {
        moreSamplesDiv.remove();
        // Reset capturedImages after finishing
        capturedImages = [];
    });
}

// Function to initialize event listeners for a class card
function attachEvents(classCard) {
    attachWidthAdjustEvent(classCard);
    attachUploadEvents(classCard);
    attachDropdownEvents(classCard);
}

// Function to handle dropdown actions
function attachDropdownEvents(classCard) {
    const moreIcon = classCard.querySelector('.more-icon');
    const dropdownMenu = classCard.querySelector('.dropdown-menu');

    moreIcon.addEventListener('click', function(event) {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        event.stopPropagation(); // Prevent click event from bubbling up
    });

    // Handle dropdown actions
    dropdownMenu.addEventListener('click', function(event) {
        const action = event.target.textContent;

        switch (action) {
            case 'Delete Class':
                deleteClass(classCard);
                break;
            case 'Disable Class':
                disableClass(classCard);
                break;
            case 'Remove All Samples':
                removeAllSamples(classCard);
                break;
            case 'Download Samples':
                downloadSamples(classCard);
                break;
            case 'Save Samples to Drive':
                saveSamplesToDrive(classCard);
                break;
            default:
                break;
        }
        dropdownMenu.style.display = 'none'; // Close dropdown after action
    });
}

// Function to delete a class
function deleteClass(classCard) {
    classCard.remove();
    alert('Class deleted.');
}

// Function to disable a class
function disableClass(classCard) {
    classCard.querySelector('.class-title').disabled = true;
    alert('Class disabled.');
}


// Function to remove all samples
function removeAllSamples(classCard) {
    const imageSamples = classCard.querySelector('.image-samples');
    
    // Use template literals to include multiline HTML content
    imageSamples.innerHTML = `
        <p>Add Image Samples:</p>
        <button class="webcam-button">Webcam</button>
        <button class="upload-button">Upload</button>
        <input type="file" class="upload-input" accept="image/*" multiple style="display:none;">
    `;
    
    attachUploadEvents(classCard);
    alert('All samples removed.');
}


// Function to download samples
function downloadSamples(classCard) {
    // Implement logic to download samples
    alert('Samples downloaded.');
}

// Function to save samples to drive
function saveSamplesToDrive(classCard) {
    // Implement logic to save samples to drive
    alert('Samples saved to Drive.');
}




document.addEventListener('DOMContentLoaded', function() {
    // Existing code for class cards
    document.querySelectorAll('.class-card').forEach(attachEvents);

    document.getElementById('add-class-button').addEventListener('click', function() {
        const classesContainer = document.getElementById('classes-container');
        const newClassCard = document.createElement('div');
        newClassCard.classList.add('class-card');
        newClassCard.innerHTML = `
            <div class="input-container">
                <input type="text" class="class-title" placeholder="Class Name">
                <div class="more-icon-container">
                    <span class="more-icon">⋮</span>
                    <div class="dropdown-menu" style="display: none;">
                        <button class="dropdown-item">Delete Class</button>
                        <button class="dropdown-item">Disable Class</button>
                        <button class="dropdown-item">Remove All Samples</button>
                        <button class="dropdown-item">Download Samples</button>
                        <button class="dropdown-item">Save Samples to Drive</button>
                    </div>
                </div>
            </div>
            <div class="image-samples">
                <p>Add Image Samples</p>
                <button class="webcam-button">Webcam</button>
                <button class="upload-button">Upload</button>
                <input type="file" class="upload-input" accept="image/*" multiple style="display:none;">
            </div>
        `;
        classesContainer.appendChild(newClassCard);
        attachEvents(newClassCard);
    });

    // Dropdown menu toggle
    document.addEventListener('click', function (event) {
        const isMoreIcon = event.target.classList.contains('more-icon');
        const isDropdownItem = event.target.classList.contains('dropdown-item');

        if (isMoreIcon) {
            const dropdownMenu = event.target.nextElementSibling;
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        } else if (!isDropdownItem) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });













    // Training section code
    const advancedHeader = document.querySelector('.advanced-header');
    const advancedContent = document.querySelector('.advanced-content');
    const arrowIcon = document.querySelector('.arrow-icon');

    if (advancedHeader && advancedContent && arrowIcon) {
        advancedHeader.addEventListener('click', function() {
            advancedContent.style.display = advancedContent.style.display === 'none' ? 'block' : 'none';
            arrowIcon.style.transform = advancedContent.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }

    const inputs = document.querySelectorAll('.input-with-controls input');
    inputs.forEach(input => {
        const incrementBtn = input.parentElement.querySelector('.increment');
        const decrementBtn = input.parentElement.querySelector('.decrement');

        if (incrementBtn && decrementBtn) {
            incrementBtn.addEventListener('click', () => updateInputValue(input, 1));
            decrementBtn.addEventListener('click', () => updateInputValue(input, -1));
        }
    });

    function updateInputValue(input, change) {
        let value = parseFloat(input.value);
        let step = parseFloat(input.step) || 1;
        value += change * step;
        if (input.min) value = Math.max(value, parseFloat(input.min));
        if (input.max) value = Math.min(value, parseFloat(input.max));
        const stepPrecision = input.step.includes('.') ? input.step.split('.')[1].length : 0;
        input.value = value.toFixed(stepPrecision);
    }

    const trainModelButton = document.getElementById('train-model-button');
    if (trainModelButton) {
        trainModelButton.addEventListener('click', function() {
            const classCards = document.querySelectorAll('.class-card');
            const classes = [];
            const images = [];

            classCards.forEach((card, index) => {
                const className = card.querySelector('.class-title')?.value;
                const fileInput = card.querySelector('.upload-input');
                
                console.log(`Class ${index + 1}:`, { className, fileInput });

                if (className && fileInput) {
                    classes.push(className);
                    if (fileInput.files && fileInput.files.length > 0) {
                        images.push(...Array.from(fileInput.files));
                    } else {
                        console.warn(`No files selected for class "${className}"`);
                    }
                } else {
                    console.warn(`Missing class name or file input for card ${index + 1}`);
                }
            });

            console.log('Classes:', classes);
            console.log('Images:', images);

            const epochs = document.getElementById('epochs').value;
            const batchSize = document.getElementById('batch-size').value;
            const learningRate = document.getElementById('learning-rate').value;

            // Get the GAN enhancement option
            const ganEnhance = document.querySelector('input[name="gan-enhance"]:checked').value;

            const trainingData = {
                classes: classes,
                images: images,
                epochs: epochs,
                batch_size: batchSize,
                learning_rate: learningRate,
                gan_enhance: ganEnhance // Add this line to include the GAN enhancement option
            };

            const formData = new FormData();
            formData.append('trainingData', JSON.stringify(trainingData));

            fetch(`${baseUrl}/train`, {
                method: 'POST',
                body: formData
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Training response:', data);
                alert(`Model training status: ${data.status}`);
            })
            .catch(error => {
                console.error('Fetch error:', error);
                if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                    alert('Network error: Unable to connect to the server. Please check your internet connection and ensure the server is running.');
                } else {
                    alert(`An error occurred during training: ${error.message}`);
                }
            });
        });
    }

    const resetDefaultsButton = document.getElementById('reset-defaults');
    if (resetDefaultsButton) {
        resetDefaultsButton.addEventListener('click', function() {
            document.getElementById('epochs').value = '50';
            document.getElementById('batch-size').value = '16';
            document.getElementById('learning-rate').value = '0.001';
        });
    }

    const underTheHoodButton = document.getElementById('under-the-hood');
    if (underTheHoodButton) {
        underTheHoodButton.addEventListener('click', function() {
            alert('Under the hood functionality not implemented in this demo.');
        });
    }

    // Tooltip functionality
    const infoIcons = document.querySelectorAll('.info-icon');
    const tooltips = document.querySelectorAll('.tooltip');

    infoIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function(e) {
            const tooltipId = `${this.dataset.tooltip}-tooltip`;
            const tooltip = document.getElementById(tooltipId);
            if (tooltip) {
                tooltip.style.display = 'block';
                positionTooltip(tooltip, this);
            }
        });

        icon.addEventListener('mouseleave', function(e) {
            const tooltipId = `${this.dataset.tooltip}-tooltip`;
            const tooltip = document.getElementById(tooltipId);
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    });

    function positionTooltip(tooltip, target) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.bottom + window.scrollY;
        let left = rect.left + window.scrollX - (tooltipRect.width / 2) + (rect.width / 2);

        if (left < 0) left = 0;
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }


 // Model training functionality
 document.getElementById('train-model-button').addEventListener('click', function() {
    const classCards = document.querySelectorAll('.class-card');
    const classes = [];
    const images = [];

    classCards.forEach(card => {
        const className = card.querySelector('.class-title').value;
        const fileInput = card.querySelector('.upload-input');
        const classImages = Array.from(fileInput.files);

        if (className && classImages.length > 0) {
            classes.push(className);
            images.push(...classImages);
        }
    });

    const epochs = document.getElementById('epochs').value;
    const batchSize = document.getElementById('batch-size').value;
    const learningRate = document.getElementById('learning-rate').value;

    const formData = new FormData();
    formData.append('classes', JSON.stringify(classes));
    formData.append('epochs', epochs);
    formData.append('batch_size', batchSize);
    formData.append('learning_rate', learningRate);

    images.forEach((image, idx) => formData.append(`image_${idx}`, image));

    fetch('/train', {
        method: 'POST',
        body: formData
    }).then(response => response.json())
      .then(data => alert(`Model training status: ${data.status}`))
      .catch(error => console.error('Error:', error));
});


























// Preview section code
const inputToggle = document.getElementById('input-toggle');
const inputSource = document.getElementById('input-source');
const fileUploadArea = document.getElementById('file-upload-area');
const driveUploadArea = document.getElementById('drive-upload-area');
const previewImage = document.getElementById('preview-image');
const outputContainer = document.getElementById('output-container');

// Toggle between different input sources (file upload or Google Drive)
if (inputToggle) {
    inputToggle.addEventListener('change', function() {
        if (fileUploadArea) fileUploadArea.style.display = this.checked ? 'block' : 'none';
        if (driveUploadArea) driveUploadArea.style.display = this.checked ? 'block' : 'none';
    });
}

// Handle input source selection (e.g., webcam functionality)
if (inputSource) {
    inputSource.addEventListener('change', function() {
        if (this.value === 'webcam') {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (previewImage) {
                        // Create a video element
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        video.autoplay = true;
                        video.playsInline = true;
                        
                        // Set video dimensions to be smaller
                        video.style.width = '320px';
                        video.style.height = '240px';
                        video.style.objectFit = 'cover';

                        // Create a container for the video
                        const videoContainer = document.createElement('div');
                        videoContainer.style.display = 'flex';
                        videoContainer.style.justifyContent = 'center';
                        videoContainer.style.alignItems = 'center';
                        videoContainer.style.width = '100%';
                        videoContainer.style.height = '100%';
                        videoContainer.appendChild(video);

                        // Replace the previewImage with the video container
                        previewImage.parentNode.replaceChild(videoContainer, previewImage);
                        
                        // Store a reference to stop the stream later if needed
                        window.streamReference = stream;

                        // Simulate classification every second
                        window.classificationInterval = setInterval(simulateImageClassification, 1000);
                    }
                })
                .catch(error => {
                    console.error('Error accessing webcam:', error);
                    alert('Failed to access webcam. Please check your permissions.');
                });
        } else {
            // If switching away from webcam, stop the stream and restore the image preview
            if (window.streamReference) {
                window.streamReference.getTracks().forEach(track => track.stop());
                window.streamReference = null;
            }
            if (window.classificationInterval) {
                clearInterval(window.classificationInterval);
            }
            restoreImagePreview();
        }
    });
}

// Function to restore image preview
function restoreImagePreview() {
    const videoContainer = document.querySelector('div:has(> video)');
    if (videoContainer && previewImage) {
        videoContainer.parentNode.replaceChild(previewImage, videoContainer);
    }
}

// Modify the file upload handler
if (fileUploadArea) {
    fileUploadArea.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (previewImage) {
                        restoreImagePreview(); // Ensure we're showing the image element
                        previewImage.src = e.target.result;  // Display the preview
                        simulateImageClassification();       // Send the image for prediction
                    }
                };
                reader.readAsDataURL(file);  // Convert the file to a data URL for preview
            }
        };

        input.click();  // Trigger file input click
    });
}



// Google API configuration
const API_KEY = 'AIzaSyD8Afc5rwQs6PTvBAAEh-1KD_5cpR1cSyM';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let pickerInited = false;
let gisInited = false;

// Handle Google Drive file uploads
if (driveUploadArea) {
    driveUploadArea.addEventListener('click', function() {
        gapi.load('client:auth2', initClient);
    });
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        gisInited = true;
        loadPicker();
    });
}

function loadPicker() {
    gapi.load('picker', {'callback': onPickerApiLoad});
}

function onPickerApiLoad() {
    pickerInited = true;
    createPicker();
}

function createPicker() {
    if (pickerInited && gisInited) {
        const picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS_IMAGES)
            .setOAuthToken(gapi.auth.getToken().access_token)
            .setDeveloperKey(API_KEY)
            .setCallback(pickerCallback)
            .build();
        picker.setVisible(true);
    }
}

function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        const fileId = data[google.picker.Response.DOCUMENTS][0][google.picker.Document.ID];
        const fileName = data[google.picker.Response.DOCUMENTS][0][google.picker.Document.NAME];
        getFileContent(fileId, fileName);
    }
}

function getFileContent(fileId, fileName) {
    gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    }).then(function(response) {
        const blob = new Blob([response.body], {type: 'image/jpeg'});
        const file = new File([blob], fileName, {type: 'image/jpeg'});
        handleImageSelection([file], driveUploadArea.closest('.class-card'));
    }, function(error) {
        console.error("Error getting file content:", error);
        alert("Error getting file from Google Drive");
    });
}

// Function to send the image to the server for prediction
function uploadForPrediction(file) {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => displayPrediction(data))
    .catch(error => console.error('Error:', error));
}

// Function to display predictions with confidence bars
function displayPrediction(data) {
    if (outputContainer) {
        outputContainer.innerHTML = '';  // Clear previous output

        // Get all class names from the class cards
        const classCards = document.querySelectorAll('.class-card');
        const categories = Array.from(classCards).map(card => {
            const classTitleInput = card.querySelector('.class-title');
            return classTitleInput ? classTitleInput.value.trim() : '';
        }).filter(name => name !== ''); // Filter out empty class names

        // If there are no classes, use a default set of categories
        if (categories.length === 0) {
            categories.push('Default Class');  // Add a default class if no categories exist
        }

        // Array of colors for different classes
        const colors = ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1', '#955251', '#b565a7', '#009b77']; // Add more colors as needed

        // Display the predictions with confidence bars
        data.predictions.forEach((prediction, index) => {
            const category = prediction.class || categories[index % categories.length]; // Use class from server or fallback
            const confidence = prediction.confidence;  // Confidence from server response
            const barColor = colors[index % colors.length];  // Assign color based on index

            const outputItem = document.createElement('div');
            outputItem.className = 'output-item';
            outputItem.innerHTML = `
                <span style="color: ${barColor}; font-size: 15px;">${category}</span> <!-- Category name -->
                <div class="output-bar" style="position: relative; background-color: #e9ecef; width: 100%; height: 20px; margin-top: 5px;">
                    <div class="output-fill" style="width: ${confidence}%; background-color: ${barColor}; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;"> 
                        ${confidence.toFixed(1)}% <!-- Confidence percentage inside the bar -->
                    </div>
                </div>
            `;
            outputContainer.appendChild(outputItem);
        });
    }
}

// Function to simulate image classification for demo purposes
function simulateImageClassification() {
    if (outputContainer) {
        outputContainer.innerHTML = '';  // Clear previous output

        // Get all class names from the class cards
        const classCards = document.querySelectorAll('.class-card');
        const categories = Array.from(classCards).map(card => {
            const classTitleInput = card.querySelector('.class-title');
            return classTitleInput ? classTitleInput.value.trim() : '';
        }).filter(name => name !== '');  // Filter out empty class names

        // If there are no classes, use a default set of categories
        if (categories.length === 0) {
            categories.push('Default Class');  // Add a default class if no categories exist
        }

        // Array of colors for different classes
        const colors = ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1', '#955251', '#b565a7', '#009b77']; // Add more colors as needed

        // Generate random confidence values and display them
        const randomValues = categories.map(() => Math.random());
        const total = randomValues.reduce((sum, value) => sum + value, 0);  // Calculate the sum of the random values
        const normalizedValues = randomValues.map(value => (value / total) * 100);  // Normalize to sum to 100

        normalizedValues.forEach((confidence, index) => {
            const category = categories[index];
            const barColor = colors[index % colors.length];

            const outputItem = document.createElement('div');
            outputItem.className = 'output-item';
            outputItem.innerHTML = `
                <span style="color: ${barColor}; font-size: 15px;">${category}</span>
                <div class="output-bar" style="position: relative; background-color: #e9ecef; width: 100%; height: 20px; margin-top: 5px;">
                    <div class="output-fill" style="width: ${confidence}%; background-color: ${barColor}; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;"> 
                        ${confidence.toFixed(1)}% 
                    </div>
                </div>
            `;
            outputContainer.appendChild(outputItem);
        });
    }
}





});

// Update the base URL if your Flask server is running on a different port or host
const baseUrl = 'http://localhost:5000';

// Function to handle fetch errors
function handleFetchError(error) {
    console.error('Fetch error:', error);
    alert('An error occurred while communicating with the server. Please check your network connection and try again.');
}

// Function to handle file upload
function handleFileUpload(file) {
    if (!file) {
        console.error('No file selected');
        alert('Please select an image file before uploading.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Upload successful:', data);
        // Handle successful upload
    })
    .catch(handleFetchError);
}

// Function to handle prediction
function handlePrediction(file) {
    if (!file) {
        console.error('No file selected');
        alert('Please select an image file before predicting.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    fetch(`${baseUrl}/predict`, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Prediction successful:', data);
        // Handle prediction results
        displayPrediction(data);
    })
    .catch(handleFetchError);
}

// Update the file input event listener
const fileInput = document.getElementById('imageUpload');
if (fileInput) {
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            handleFileUpload(file);
            // You can also trigger prediction here if needed
            // handlePrediction(file);
        }
    });
}

