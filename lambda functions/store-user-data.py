"""
This AWS Lambda function handles storing and updating user data in an RDS MySQL database.

Environment Variables:
- RDS_HOST: The hostname of the RDS MySQL database.
- RDS_USERNAME: The username for the RDS MySQL database.
- RDS_PASSWORD: The password for the RDS MySQL database.
- RDS_DB_NAME: The database name for the RDS MySQL database.

Function:
- lambda_handler(event, context): The main entry point for the Lambda function.

Parameters:
- event: The event data passed to the Lambda function, expected to contain a JSON body with user data.
- context: The runtime information of the Lambda function.

Returns:
- dict: A dictionary containing the status code and a message indicating success or failure.

The function performs the following steps:
1. Parses the incoming event body to extract user data.
2. Establishes a connection to the RDS MySQL database.
3. Checks if user data already exists in the database.
4. If no data exists, initializes a default dictionary for the user.
5. Updates the fields with new data from the event body.
6. Inserts or updates the user data in the MySQL database.
7. Commits the transaction.
8. Returns a success response if the operation is successful.
9. Returns an error response if any exception occurs.
"""

import json
import pymysql
import os

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
        userID = body["userID"]

        with connection.cursor() as cursor:
            # Check if user data exists
            cursor.execute("SELECT * FROM CleanPlate WHERE userID = %s", (userID,))
            existing_data = cursor.fetchone()

            # If no data exists for the user, initialize a default dictionary
            if not existing_data:
                existing_data = {
                    "userID": userID,
                    "products": [],
                    "groceries": [],
                    "score": 0,
                    "totalWaste": 0,
                    "co2Reduction": 0,
                    "count": 0,
                }

            # Update the fields with new data
            existing_data["products"] = body.get("products", existing_data["products"])
            existing_data["groceries"] = body.get(
                "groceries", existing_data["groceries"]
            )
            existing_data["score"] = body.get("score", existing_data["score"])
            existing_data["totalWaste"] = body.get(
                "totalWaste", existing_data["totalWaste"]
            )
            existing_data["co2Reduction"] = body.get(
                "co2Reduction", existing_data["co2Reduction"]
            )
            existing_data["count"] = body.get("count", existing_data["count"])

            # Insert or update the data in the MySQL database
            cursor.execute(
                """
                INSERT INTO CleanPlate (userID, products, groceries, score, totalWaste, co2Reduction, count)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    products = VALUES(products),
                    groceries = VALUES(groceries),
                    score = VALUES(score),
                    totalWaste = VALUES(totalWaste),
                    co2Reduction = VALUES(co2Reduction),
                    count = VALUES(count)
            """,
                (
                    userID,
                    json.dumps(existing_data["products"]),
                    json.dumps(existing_data["groceries"]),
                    existing_data["score"],
                    existing_data["totalWaste"],
                    existing_data["co2Reduction"],
                    existing_data["count"],
                ),
            )

            # Commit the transaction
            connection.commit()

        # Success response
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Data updated successfully"}),
        }

    except Exception as e:
        # Return error response
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
