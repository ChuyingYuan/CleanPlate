"""
This AWS Lambda function fetches food donation locations from an RDS MySQL database.

Environment Variables:
- RDS_HOST: The hostname of the RDS MySQL instance.
- RDS_USERNAME: The username to connect to the RDS MySQL instance.
- RDS_PASSWORD: The password to connect to the RDS MySQL instance.
- RDS_DB_NAME: The database name to connect to in the RDS MySQL instance.

Parameters:
- event: The event data passed to the Lambda function.
- context: The context in which the Lambda function is called.

Returns:
- dict: A dictionary containing the HTTP status code, headers, and body with the fetched data in JSON format.
    - statusCode (int): HTTP status code (200 for success, 500 for error).
    - headers (dict): HTTP headers including Content-Type and Access-Control-Allow-Origin.
    - body (str): JSON string containing the fetched data or error message.

Raises:
- Exception: If there is any error during the database connection or data fetching process.
"""

import json
import pymysql
import os


def lambda_handler(event, context):
    # Please refer to the Support Document for the following environment variables
    rds_host = os.getenv("RDS_HOST")
    rds_username = os.getenv("RDS_USERNAME")
    rds_password = os.getenv("RDS_PASSWORD")
    rds_db_name = os.getenv("RDS_DB_NAME")

    # Establish connection to RDS MySQL database
    connection = None

    try:
        connection = pymysql.connect(
            host=rds_host,
            user=rds_username,
            password=rds_password,
            db=rds_db_name,
            cursorclass=pymysql.cursors.DictCursor,
        )

        with connection.cursor() as cursor:
            # SQL query to fetch data from food_donation table
            sql_query = "SELECT organization, building_name, address, phone_number, link FROM food_donation"
            cursor.execute(sql_query)

            # Fetch all rows from the table
            rows = cursor.fetchall()

            # Format the rows into JSON format
            data = []
            for row in rows:
                clean_row = {
                    "Organization": row["organization"],
                    "Building Name": row["building_name"],
                    "Address": row["address"],
                    "Phone_number": (
                        row["phone_number"] if row["phone_number"] else "N/A"
                    ),
                    "Link": row["link"],
                }
                data.append(clean_row)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(data),
        }

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

    finally:
        # Close the database connection if it was established
        if connection:
            connection
