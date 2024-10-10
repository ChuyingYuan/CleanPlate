# Use the official AWS Lambda Python 3.10 runtime as a base image
FROM public.ecr.aws/lambda/python:3.10

# Install Python dependencies
RUN pip install torch==2.4.0 torchvision numpy Pillow==9.4.0 openai-clip==1.0.1 boto3

# Copy your Lambda function code into the container
COPY app.py ${LAMBDA_TASK_ROOT}

# Set the CMD to your Lambda function handler
CMD ["app.lambda_handler"]
