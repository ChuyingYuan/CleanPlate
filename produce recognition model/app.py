"""
This script is designed to recognize produce items from an image using a pre-trained CLIP model.

Modules:
    torch: PyTorch library for tensor computations and deep learning.
    clip: OpenAI's CLIP model for image and text embeddings.
    PIL: Python Imaging Library for image processing.
    numpy: Library for numerical computations.
    boto3: AWS SDK for Python to interact with S3.
    io: Core tools for working with streams.
    base64: Library for encoding and decoding base64.

Functions:
    lambda_handler(event, context):
        AWS Lambda handler function to process the input event and return the recognized produce label.
        Args:
            event (dict): The input event containing the base64 encoded image.
            context (object): The context in which the function is called.
        Returns:
            dict: A dictionary containing the status code and the recognized label or an error message.
"""

import torch
import clip
from PIL import Image
import numpy as np
import boto3
import io
import base64


# Initialize S3 client
s3 = boto3.client("s3")

# Define the S3 bucket and key
bucket_name = "ta13onboarding"
model_key = "clip_entire_model.pth"

# Download the model to a writable directory
s3.download_file(bucket_name, model_key, "/tmp/model.pth")

# Load the model from the downloaded file
device = "cuda" if torch.cuda.is_available() else "cpu"
model = torch.load("/tmp/model.pth", map_location=device)

# Specify the model name
model_name = "ViT-B/32"

# Load only the preprocess function, and specify cache path to /tmp
_, preprocess = clip.load(model_name, device=device, download_root="/tmp")

# Define labels
labels = [
    "Artichokes",
    "Asparagus",
    "Bamboo shoots",
    "Beans",
    "Peas",
    "Beets",
    "Bok choy",
    "Broccoli",
    "Broccoli raab",
    "Brussels sprouts",
    "Cabbage",
    "Carrots",
    "Parsnips",
    "Cauliflower",
    "Celery",
    "Corn on the cob",
    "Cucumbers",
    "Eggplant",
    "Garlic",
    "Ginger root",
    "Greens",
    "Herbs",
    "Leeks",
    "Lettuce",
    "Mushrooms",
    "Okra",
    "Onions",
    "Peppers",
    "Potatoes",
    "Pumpkins",
    "Radishes",
    "Rhubarb",
    "Rutabagas",
    "Squash",
    "Tamarind",
    "Taro",
    "Tomatoes",
    "Turnips",
    "Yuca",
    "Cassava",
    "Swiss chard",
    "Bean sprouts",
    "Zucchini",
    "Hot peppers",
    "Celery root",
    "Radicchio",
    "Arugula",
    "Apples",
    "Apricots",
    "Avocados",
    "Bananas",
    "Berries",
    "Blueberries",
    "Cherimoya",
    "Citrus fruit",
    "Coconut",
    "Coconuts",
    "Cranberries",
    "Dates",
    "Grapes",
    "Guava",
    "Kiwi fruit",
    "Melons",
    "Papaya",
    "Mango",
    "Feijoa",
    "Passionfruit",
    "Casaha melon",
    "Peaches",
    "Nectarines",
    "Plums",
    "Pears",
    "Sapote",
    "Pineapple",
    "Plantains",
    "Pomegranate",
    "Star fruit",
    "Prickly pear",
    "Pitaya",
    "Dragon fruit",
    "Strawberries",
    "Raspberries",
    "Cherries",
    "Watermelon",
    "Cantaloupe",
    "Honeydew",
    "Lemon juice",
    "Lime juice",
    "Yuzu juice",
    "Apple juice",
    "Carrot juice",
]


def lambda_handler(event, context):
    image_base64 = event.get("image_base64")

    if not image_base64:
        return {"statusCode": 400, "body": "No image data provided"}

    # Decode and preprocess the image
    image_data = base64.b64decode(image_base64)
    image = preprocess(Image.open(io.BytesIO(image_data))).unsqueeze(0).to(device)

    # Tokenize the labels
    text = clip.tokenize(labels).to(device)

    with torch.no_grad():
        # Encode image and text
        image_features = model.encode_image(image)
        text_features = model.encode_text(text)

        # Compute similarity scores
        logits_per_image, logits_per_text = model(image, text)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()

    # Get the label with the highest probability
    max_prob_index = np.argmax(probs)
    highest_prob_label = labels[max_prob_index]

    return {"statusCode": 200, "body": {"label": highest_prob_label}}
