"""
This AWS Lambda function retrieves user data from an RDS MySQL database based on the provided userID.

Environment Variables:
- RDS_HOST: The hostname of the RDS MySQL instance.
- RDS_USERNAME: The username to connect to the RDS MySQL instance.
- RDS_PASSWORD: The password to connect to the RDS MySQL instance.
- RDS_DB_NAME: The database name to connect to in the RDS MySQL instance.

Functions:
- convert_decimal_to_float(data): Recursively converts Decimal objects to float for JSON serialization.

Lambda Handler:
- lambda_handler(event, context): The main entry point for the AWS Lambda function. It expects an event with a JSON body containing the userID. It retrieves the user data from the database and returns it in the response.

Parameters:
- event (dict): The event dictionary containing the request data.
- context (object): The context object containing runtime information.

Returns:
- dict: A dictionary containing the statusCode and body. The body contains the user data if found, or an error message if not found or if an exception occurs.
"""

import json
import pymysql
import os
from decimal import Decimal


# Function to convert Decimal objects to float for JSON serialization
def convert_decimal_to_float(data):
    if isinstance(data, dict):
        return {k: convert_decimal_to_float(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_decimal_to_float(i) for i in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data


# Please refer to the Support Document for the following environment variables
rds_host = os.getenv("RDS_HOST")
rds_username = os.getenv("RDS_USERNAME")
rds_password = os.getenv("RDS_PASSWORD")
rds_db_name = os.getenv("RDS_DB_NAME")


# Establish connection to RDS MySQL database
connection = pymysql.connect(
    host=rds_host,
    user=rds_username,
    password=rds_password,
    db=rds_db_name,
    cursorclass=pymysql.cursors.DictCursor,
)


def lambda_handler(event, context):
    try:
        body = json.loads(event["body"])
        user_id = body["userID"]
        print(json.dumps(event, indent=2))

        with connection.cursor() as cursor:
            # Fetch user data based on userID
            sql_query = "SELECT * FROM CleanPlate WHERE userID = %s"
            cursor.execute(sql_query, (user_id,))
            result = cursor.fetchone()

            # Check if the item exists
            if result:
                result = convert_decimal_to_float(result)

                # Successful response
                return {"statusCode": 200, "body": json.dumps({"data": result})}
            else:
                # Error response (Item not found)
                return {
                    "statusCode": 404,
                    "body": json.dumps({"error": "Item not found"}),
                }

    except Exception as e:
        # Error response (Handle Exceptions)
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
