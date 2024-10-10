"""
This AWS Lambda function retrieves grocery store data from an RDS MySQL database.

Environment Variables:
- RDS_HOST: The hostname of the RDS MySQL instance.
- RDS_USERNAME: The username to connect to the RDS MySQL instance.
- RDS_PASSWORD: The password to connect to the RDS MySQL instance.
- RDS_DB_NAME: The database name to connect to in the RDS MySQL instance.

Parameters:
- event: The event data passed to the Lambda function.
- context: The context in which the Lambda function is called.

Returns:
    dict: A dictionary containing the status code and the body of the response.
        - statusCode (int): The HTTP status code of the response.
        - body (str): A JSON string containing the result of the query or an error message.
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
            # Query to retrieve data from the Grocery_Store_Location table
            sql_query = """
                SELECT Trading_ID, Trading_name, Business_address, CLUE_small_area, 
                       Census_year, Industry_ANZSIC4_code, Industry_ANZSIC4_description, 
                       Longitude, Latitude, Mccid_int
                FROM Grocery_Store_Location
            """
            cursor.execute(sql_query)
            rows = cursor.fetchall()

            # Return the fetched data as a JSON response
            return {"statusCode": 200, "body": json.dumps(rows)}

    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

    finally:
        if connection:
            connection.close()
