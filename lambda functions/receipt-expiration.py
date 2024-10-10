"""
This script processes receipt data and categorizes food items based on predefined categories.

Environment Variables:
- RDS_HOST: The hostname of the RDS MySQL instance.
- RDS_USERNAME: The username to connect to the RDS MySQL instance.
- RDS_PASSWORD: The password to connect to the RDS MySQL instance.
- RDS_DB_NAME: The database name to connect to in the RDS MySQL instance.

Functions:
- convert_decimal_to_float(data): Recursively converts Decimal objects to float for JSON serialization.
- categorize_food_items(receipt_data): Categorizes food items from the receipt data into predefined categories.
- lambda_handler(event, context): The main entry point for the AWS Lambda function. It expects an event with a JSON body containing receipt data. It processes the receipt data and returns categorized food items.

Lambda Handler:
- lambda_handler(event, context): The main entry point for the AWS Lambda function. It expects an event with a JSON body containing receipt data. It processes the receipt data and returns categorized food items.

Parameters:
- event (dict): The event dictionary containing the request data.
- context (object): The context object containing runtime information.

Returns:
- dict: A dictionary containing the statusCode and body. The body contains the categorized food items if the processing is successful, or an error message if not found or if an exception occurs.

Food Categories:
- vegetables: Includes items like Artichokes, Asparagus, Bamboo shoots, Beans and peas, Beets, Bok choy, Broccoli, Brussels sprouts, Cabbage, Carrots, Cauliflower, Celery, Corn, Cucumbers, Eggplant, Garlic, Ginger root, Greens, Leeks, Lettuce, Mushrooms, Okra, Onions, Peppers, Potatoes.
"""

import json
import pandas as pd
from datetime import datetime, timedelta
import re
import os
import pymysql


# Define food categories
food_categories = [
    {
        "category": "vegetables",
        "items": [
            "Artichokes",
            "Asparagus",
            "Bamboo shoots",
            "Beans and peas",
            "Beets",
            "Bok choy",
            "Broccoli",
            "Brussels sprouts",
            "Cabbage",
            "Carrots",
            "Cauliflower",
            "Celery",
            "Corn",
            "Cucumbers",
            "Eggplant",
            "Garlic",
            "Ginger root",
            "Greens",
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
            "Taro",
            "Tomatoes",
            "Turnips",
            "Yuca/cassava",
            "Yams/sweet potatoes",
            "Kale",
            "Jicama",
            "Kohlrabi",
            "Baby carrots",
            "Zucchini",
            "Hot peppers",
            "Bean sprouts",
            "Swiss chard",
            "Spaghetti squash",
            "Cherry tomatoes",
            "Celery root",
            "Radicchio",
            "Arugula",
        ],
    },
    {
        "category": "meat",
        "items": [
            "Beef",
            "Lamb",
            "Veal",
            "Pork",
            "Goat",
            "Venison",
            "Bacon",
            "Corned beef",
            "Ham",
            "Hot dogs",
            "Sausage",
            "Jerky",
            "Chicken",
            "Turkey",
            "Duckling",
            "Goose",
            "Pheasant",
            "Quail",
            "Capon",
            "Cornish Hens",
            "Giblets",
            "Turducken",
            "Chicken nuggets",
            "Fried chicken",
            "Rotisserie chicken",
            "Rabbit",
            "Bison",
            "Chorizo",
            "Bratwurst",
            "Pastrami",
            "Prosciutto",
        ],
    },
    {
        "category": "seafood",
        "items": [
            "Lean fish",
            "Fatty fish",
            "Caviar",
            "Surimi seafood",
            "Scallops",
            "Shrimp",
            "Crayfish",
            "Squid",
            "Clams",
            "Mussels",
            "Oysters",
            "Crab meat",
            "Crab legs",
            "Lobster",
            "Herring",
            "Tuna",
            "Anchovies",
        ],
    },
    {
        "category": "fruit",
        "items": [
            "Apples",
            "Apricots",
            "Avocados",
            "Bananas",
            "Berries",
            "Blueberries",
            "Cherimoya",
            "Citrus fruit",
            "Coconut",
            "Cranberries",
            "Dates",
            "Grapes",
            "Guava",
            "Kiwi fruit",
            "Melons",
            "Papaya",
            "Mango",
            "Peaches",
            "Nectarines",
            "Plums",
            "Pears",
            "Pineapple",
            "Plantains",
            "Pomegranate",
            "Kumquats",
            "Star fruit",
            "Prickly pear",
            "Pitaya/dragon fruit",
            "Strawberries",
            "Raspberries",
            "Cherries",
            "Watermelon",
            "Cantaloupe",
            "Honeydew",
            "Yuzu",
        ],
    },
    {
        "category": "dairy",
        "items": [
            "Butter",
            "Buttermilk",
            "Cheese",
            "Coffee creamer",
            "Cottage cheese",
            "Cream cheese",
            "Cream",
            "Egg substitutes",
            "Eggnog",
            "Eggs",
            "Kefir",
            "Margarine",
            "Milk",
            "Pudding",
            "Whipped cream",
            "Whipped topping",
            "Yogurt",
            "Ricotta",
            "String Cheese",
            "Vegan Cheddar Cheese",
            "Quark",
            "Cheese Curds",
        ],
    },
]


# Please refer to the Support Document for the following environment variables
rds_host = os.getenv("RDS_HOST")
rds_username = os.getenv("RDS_USERNAME")
rds_password = os.getenv("RDS_PASSWORD")
rds_db_name = os.getenv("RDS_DB_NAME")


# Load food data from RDS
def load_data_from_rds():
    rds_host = os.getenv("RDS_HOST")
    rds_username = os.getenv("RDS_USERNAME")
    rds_password = os.getenv("RDS_PASSWORD")
    rds_db_name = os.getenv("RDS_DB_NAME")

    # Establish connection to the RDS MySQL database
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
            cursor.execute(
                """
                SELECT 
                    fk.Food_name_ID,
                    fk.Food_name,
                    fk.Food_name_subtitle,
                    fk.Food_Keywords,
                    fk.DOP_min,
                    fk.DOP_max,
                    dm.DOP_Metric_desc,
                    pt.Preservation_type_desc
                FROM Food_Keeper fk
                JOIN DOP_metric dm ON fk.DOP_metric_id = dm.DOP_Metric_ID
                JOIN Preservation_type pt ON fk.Preservation_type_id = pt.Preservation_type_id
            """
            )
            result = cursor.fetchall()

        # Convert result to a DataFrame
        if result:
            return pd.DataFrame(result)
        else:
            # Return an empty DataFrame if no results
            return pd.DataFrame()
    except Exception as e:
        print(f"Error loading data from RDS: {e}")
        raise
    finally:
        if connection:
            connection.close()


# Process extracted text to split by '/' and clean each segment.
def process_extracted_text(text):
    segments = text.lower().split("/")
    number_unit_pattern = re.compile(
        r"(\d+|\d*\.\d+|kg|mg|ml|ea|pk|ch|ltr|g|oz|cm|mm|inch|ea|qty|$/)|[^\w\s]"
    )

    cleaned_segments = []

    for segment in segments:
        words = segment.split()
        cleaned_words = [word for word in words if not number_unit_pattern.match(word)]
        refined_words = [word for word in cleaned_words if len(word) > 1]
        cleaned_segment = " ".join(refined_words)
        if cleaned_segment:
            cleaned_segments.append(cleaned_segment)

    return cleaned_segments


# Remove numbers and units from the extracted product name.
def clean_name(name):
    clean_pattern = r"\b\d+(\.\d+)?\s*(g|kg|ml|l|oz|lb|mg|litre|liter|pcs|piece|slices|dozen|pack|packet|bottle|can|jar|box)?\b"
    cleaned_name = re.sub(clean_pattern, "", name)
    cleaned_name = re.sub(r"\s+", " ", cleaned_name).strip()
    return cleaned_name


# Calculate expiration date based on shelf life
def calculate_expiration_date(row):
    today = datetime.now()
    max_duration = row.get("dop_max", 0)
    metric = row.get("DOP_Metric_desc", "days").lower()

    if metric == "days":
        expiration_date = today + timedelta(days=max_duration)
    elif metric == "weeks":
        expiration_date = today + timedelta(weeks=max_duration)
    elif metric == "months":
        expiration_date = today + timedelta(days=max_duration * 30)
    elif metric == "years" or metric == "year":
        expiration_date = today + timedelta(days=max_duration * 365)
    else:
        expiration_date = None

    expiration_str = expiration_date.strftime("%Y-%m-%d") if expiration_date else None
    return expiration_str


# Function to search an extracted product name string in csv data, and returns the best matching records with the farthest expiration date
def search_product_name(product_name):
    # Load DataFrame from RDS
    df = load_data_from_rds()

    # Ensure columns are in lowercase for case-insensitive comparison
    df.columns = [col.lower() for col in df.columns]

    # Update column references in the DataFrame
    df["food_name"] = df["food_name"].apply(
        lambda x: x.lower() if isinstance(x, str) else x
    )
    df["food_name_subtitle"] = df["food_name_subtitle"].apply(
        lambda x: x.lower() if isinstance(x, str) else x
    )
    df["food_keywords"] = df["food_keywords"].apply(
        lambda x: x.lower() if isinstance(x, str) else x
    )
    df["dop_metric_desc"] = df["dop_metric_desc"].apply(
        lambda x: x.lower() if isinstance(x, str) else x
    )
    df["preservation_type_desc"] = df["preservation_type_desc"].apply(
        lambda x: x.lower() if isinstance(x, str) else x
    )

    # Process the product name using the provided text
    extracted_list = process_extracted_text(product_name)
    cleaned_extracted_list = [clean_name(item) for item in extracted_list]

    result_df = pd.DataFrame()

    # Loop through each cleaned segment
    for original_name, cleaned_name in zip(extracted_list, cleaned_extracted_list):
        matches = pd.DataFrame()

        # Find all matches for the current cleaned name
        for item in cleaned_name.split(" "):
            if item.lower() in df.values:
                specific_rows = df[df["food_name"] == (str(item).lower())].copy()
                if not specific_rows.empty:
                    specific_rows["extracted_name"] = cleaned_name
                    matches = pd.concat([matches, specific_rows])

        # Calculate the expiration date for each and keep the one with the farthest expiration
        if not matches.empty:
            matches["expiration_date"] = matches.apply(
                calculate_expiration_date, axis=1
            )
            matches = matches.sort_values(by="expiration_date", ascending=False)
            best_match = matches.iloc[
                0
            ]  # Keep the one with the most distant expiration date
            result_df = pd.concat([result_df, best_match.to_frame().T])

    # Initialize the 'category' column with 'others' by default
    result_df["category"] = "others"
    result_df["imgUrl"] = (
        "https://img.icons8.com/?size=100&id=32236&format=png&color=000000"
    )

    # Assign categories and image URLs based on the 'food_name' column
    for index, row in result_df.iterrows():
        item_name = row["food_name"]
        for category_info in food_categories:
            category = category_info["category"]
            items = set(item.lower() for item in category_info["items"])
            if item_name in items:
                result_df.at[index, "category"] = category
                if category == "vegetables":
                    result_df.at[index, "imgUrl"] = (
                        "https://img.icons8.com/?size=100&id=64432&format=png&color=000000"
                    )
                elif category == "fruits":
                    result_df.at[index, "imgUrl"] = (
                        "https://img.icons8.com/?size=100&id=18957&format=png&color=000000"
                    )
                elif category == "dairy":
                    result_df.at[index, "imgUrl"] = (
                        "https://img.icons8.com/?size=100&id=12874&format=png&color=000000"
                    )
                elif category == "meat":
                    result_df.at[index, "imgUrl"] = (
                        "https://img.icons8.com/?size=100&id=13306&format=png&color=000000"
                    )
                elif category == "seafood":
                    result_df.at[index, "imgUrl"] = (
                        "https://img.icons8.com/?size=100&id=dcNXeTC0SjGX&format=png&color=000000"
                    )
                break

    # Remove unnecessary columns
    result_df = result_df.drop("food_name_subtitle", axis="columns")
    result_df = result_df.drop("food_keywords", axis="columns")

    # Return the final JSON output including the cleaned names and farthest expiration date
    json_output = result_df.to_json(orient="records", lines=False)
    return json_output


def lambda_handler(event, context):
    print(event)
    text = event.get("finalText")
    if not text:
        return {"statusCode": 400, "body": json.dumps("text is required")}

    try:
        # Search for product names in the extracted text
        json_output = search_product_name(text)
        return {
            "statusCode": 200,
            "body": json_output,
            "headers": {"Content-Type": "application/json"},
        }
    except Exception as e:
        # Log and return an error response
        print(f"Error processing request: {e}")
        return {"statusCode": 500, "body": json.dumps("Internal server error")}
