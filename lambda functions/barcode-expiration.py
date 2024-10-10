"""
This AWS Lambda function determines the expiration date of food products based on their barcode.
It includes functions to load food data from an RDS MySQL database, clean and normalize product names, 
categorize food items, and calculate expiration dates based on predefined shelf lives.

Environment Variables:
- RDS_HOST: The hostname of the RDS MySQL instance.
- RDS_USERNAME: The username to connect to the RDS MySQL instance.
- RDS_PASSWORD: The password to connect to the RDS MySQL instance.
- RDS_DB_NAME: The database name to connect to in the RDS MySQL instance.

Parameters:
- event: The event data passed to the Lambda function.
- context: The context in which the Lambda function is called.

Functions:
    load_food_data() -> dict:
        Loads food data from an RDS MySQL database and returns it as a dictionary.
    
    clean_product_name(product_name: str) -> str:
        Cleans the product name by removing non-alphanumeric characters.
    
    normalize_product_name(product_name: str) -> str:
        Normalizes the product name by predefined variations.
    
    singularize_word(word: str) -> str:
        Converts a plural word to its singular form.
    
    normalize_and_singularize_product_name(product_name: str) -> str:
        Normalizes and singularizes the product name.
    
    filter_stop_words(text: str) -> str:
        Filters out common stop words from the given text.
    
    search_product(product_name: str, data: dict) -> dict:
        Searches for a product in the food data and returns the matching record.
    
    categorize_food(product_name: str) -> str:
        Determines the food category of the given product name.
    
    calculate_expiration_date(max_shelf_life: float, metrics: str) -> str:
        Calculates the expiration date based on the maximum shelf life and metrics.
    
    parse_expiration_date(exp_date: str) -> str:
        Parses the expiration date from various formats to a standardized format.
    
    lambda_handler(event: dict, context: dict) -> dict:
        AWS Lambda handler function to process the event and return the expiration date of the product.

Returns:
    dict: A dictionary containing the status code and the body of the response.
        - statusCode (int): The HTTP status code of the response.
        - body (str): A JSON string containing the result or an error message.
"""

import json
import urllib.request
from datetime import datetime, timedelta
import re
import inflect
import os
import pymysql


p = inflect.engine()

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
            "Daikon",
            "Fennel",
            "Leek",
            "Seaweed",
            "Mustard greens",
            "Okra",
            "Horseradish",
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
            "Salami",
            "Kielbasa",
            "Pork chop",
            "Ribs",
            "Steak",
            "Filet mignon",
            "Liver",
            "Tongue",
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
            "Sardines",
            "Mackerel",
            "Eel",
            "Octopus",
            "Sea urchin",
            "Abalone",
            "Cockles",
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
            "Pawpaw",
            "Persimmon",
            "Jackfruit",
            "Fig",
            "Quince",
            "Galia melon",
            "Nance",
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
            "Creamer",
            "Ghee",
            "Clotted cream",
            "Sour cream",
            "Skyr",
            "Greek yogurt",
            "Mascarpone",
            "Cottage cheese",
        ],
    },
]

# Define estimated shelf lives for different food categories
estimated_shelf_lives = {
    "vegetables": {"default": 7, "metrics": "days", "method": "refrigerated"},  # days
    "meat": {"default": 3, "metrics": "days", "method": "refrigerated"},  # days
    "seafood": {"default": 2, "metrics": "days", "method": "refrigerated"},  # days
    "fruit": {
        "default": 7,  # days
        "metrics": "days",
        "method": "room temperature or refrigerated",
    },
    "dairy": {"default": 14, "metrics": "days", "method": "refrigerated"},  # days
    "others": {"default": 180, "metrics": "days", "method": "pantry"},  # days
}

# List of common stop words to omit
stop_words = set(
    [
        "a",
        "an",
        "the",
        "and",
        "or",
        "but",
        "of",
        "to",
        "in",
        "for",
        "on",
        "with",
        "at",
        "by",
        "from",
        "as",
        "has",
        "that",
        "which",
        "who",
        "whom",
        "whose",
        "this",
        "these",
        "those",
        "all",
        "any",
        "each",
        "every",
        "one",
        "some",
        "any",
        "no",
        "not",
        "such",
        "own",
        "more",
        "most",
        "other",
        "another",
        "each",
        "few",
        "less",
        "many",
        "much",
        "more",
        "several",
        "own",
        "same",
    ]
)

# Please refer to the Support Document for the following environment variables
rds_host = os.getenv("RDS_HOST")
rds_username = os.getenv("RDS_USERNAME")
rds_password = os.getenv("RDS_PASSWORD")
rds_db_name = os.getenv("RDS_DB_NAME")


# Load food data from RDS
def load_food_data():
    # Establish connection to RDS MySQL database
    connection = None
    food_data = {}

    try:
        connection = pymysql.connect(
            host=rds_host,
            user=rds_username,
            password=rds_password,
            database=rds_db_name,
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
            rows = cursor.fetchall()
            for row in rows:
                food_name = row["Food_name"].lower()
                food_data[food_name] = {
                    "ID": row["Food_name_ID"],
                    "Name": row["Food_name"],
                    "Name_subtitle": row["Food_name_subtitle"],
                    "Keywords": row["Food_Keywords"],
                    "DOP_Refrigerate_Min": row["DOP_min"],
                    "DOP_Refrigerate_Max": row["DOP_max"],
                    "DOP_Refrigerate_Metric": row["DOP_Metric_desc"],
                    "type": row["Preservation_type_desc"],
                }
    except Exception as e:
        raise RuntimeError(f"Error loading food data from RDS: {e}")
    finally:
        if connection:
            connection.close()

    return food_data


# Clean product name for searching
def clean_product_name(product_name):
    return " ".join(re.sub(r"[^\w\s]", "", part) for part in product_name.split())


# Normalize product name by predefined variations
def normalize_product_name(product_name):
    variations = {
        "yogurt": ["yogurt", "yoghurt"],
    }
    product_name_clean = re.sub(r"[^\w\s]", "", product_name.lower()).strip()
    for normalized_name, aliases in variations.items():
        if any(alias in product_name_clean for alias in aliases):
            return normalized_name
    return product_name_clean


# Convert plural to singular
def singularize_word(word):
    return p.singular_noun(word) or word


# Normalize product name including singularization
def normalize_and_singularize_product_name(product_name):
    product_name_clean = normalize_product_name(product_name)
    words = product_name_clean.split()
    singularized_words = [singularize_word(word) for word in words]
    return " ".join(singularized_words)


# Function to filter stop words from text
def filter_stop_words(text):
    return " ".join(word for word in text.lower().split() if word not in stop_words)


# Function to search for a product in the food data
def search_product(product_name, data):
    normalized_name = normalize_and_singularize_product_name(product_name)
    filtered_name = filter_stop_words(normalized_name)
    product_name_clean = re.sub(r"[^\w\s]", "", filtered_name).lower().strip()
    product_name_parts = set(product_name_clean.split())

    def match(row):
        row_name_clean = re.sub(r"[^\w\s]", "", row.get("Name", "")).lower().strip()
        filtered_row_name = filter_stop_words(row_name_clean)
        row_parts = set(filtered_row_name.split())

        keywords = re.split(r"[,;]", row.get("Keywords", "").lower().strip())
        filtered_keywords = filter_stop_words(" ".join(keywords))

        subtitle_parts = re.split(
            r"[,;]|such as", row.get("Name_subtitle", "").lower().strip()
        )
        filtered_subtitles = filter_stop_words(" ".join(subtitle_parts))

        combined_row_parts = (
            set(row_parts)
            .union(filtered_keywords.split())
            .union(filtered_subtitles.split())
        )

        return any(part in combined_row_parts for part in product_name_parts)

    matches = [row for name, row in data.items() if match(row)]
    return matches[0] if matches else None


# Determine food category
def categorize_food(product_name):
    normalized_name = normalize_and_singularize_product_name(product_name)
    product_words = set(normalized_name.split())

    for category_info in food_categories:
        category = category_info["category"]
        items = set(item.lower() for item in category_info["items"])
        if any(word in items for word in product_words):
            return category
    return "others"


# Calculate expiration date based on shelf life
def calculate_expiration_date(max_shelf_life, metrics):
    today = datetime.now()
    if metrics.lower() == "years":
        return (today + timedelta(days=float(max_shelf_life) * 365)).strftime(
            "%Y-%m-%d"
        )
    elif metrics.lower() == "months":
        return (today + timedelta(days=float(max_shelf_life) * 30)).strftime("%Y-%m-%d")
    elif metrics.lower() == "weeks":
        return (today + timedelta(weeks=float(max_shelf_life))).strftime("%Y-%m-%d")
    elif metrics.lower() == "days":
        return (today + timedelta(days=float(max_shelf_life))).strftime("%Y-%m-%d")
    return "As Soon As Possible"


# Function to parse expiration date
def parse_expiration_date(exp_date):
    try:
        if re.match(r"\d{4}-\d{2}", exp_date):  # yyyy-mm
            year, month = map(int, exp_date.split("-"))
            last_day = (datetime(year, month % 12 + 1, 1) - timedelta(days=1)).strftime(
                "%Y-%m-%d"
            )
            return last_day
        elif re.match(r"\d{2}-\d{4}", exp_date):  # mm-yyyy
            month, year = map(int, exp_date.split("-"))
            last_day = (datetime(year, month, 1) + timedelta(days=31)).replace(
                day=1
            ) - timedelta(days=1)
            return last_day.strftime("%Y-%m-%d")
        elif re.match(r"\d{4}-\d{2}-\d{2}", exp_date):  # yyyy-mm-dd
            return exp_date
    except ValueError:
        pass
    return "As Soon As Possible"


def lambda_handler(event, context):
    barcode = event.get("barcode")
    if not barcode:
        return {"statusCode": 400, "body": json.dumps("Barcode is required")}

    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    try:
        with urllib.request.urlopen(url) as response:
            product_data = json.loads(response.read().decode())

        if product_data.get("status") == 0:
            return {"statusCode": 404, "body": "Product not found"}

        product_name = (
            product_data["product"].get("product_name")
            or product_data["product"].get("product_name_en")
            or product_data["product"].get("product_name_fr")
            or "Not available"
        )

        expiration_date = product_data["product"].get("expiration_date")
        min_shelf_life = "Not available"
        max_shelf_life = "Not available"
        method = "Not available"
        metrics = "Not available"

        if expiration_date:
            expiration_date = parse_expiration_date(expiration_date)
        else:
            food_data = load_food_data()
            cleaned_product_name = clean_product_name(product_name.lower())
            record = search_product(cleaned_product_name, food_data)
            print(record)
            if record:
                min_shelf_life = record.get("DOP_Refrigerate_Min", "Not available")
                max_shelf_life = record.get("DOP_Refrigerate_Max", "Not available")
                method = record.get("type", "Not available")
                metrics = record.get("DOP_Refrigerate_Metric", "Not available")
                expiration_date = calculate_expiration_date(max_shelf_life, metrics)
            else:
                min_shelf_life = "Not available"
                max_shelf_life = "Not available"
                method = "Not available"
                metrics = "Not available"
                expiration_date = "As Soon As Possible"

        category = categorize_food(product_name)
        if expiration_date == "As Soon As Possible":
            if estimated_shelf_lives.get(category):
                default_shelf_life = estimated_shelf_lives[category]["default"]
                metrics = estimated_shelf_lives[category]["metrics"]
                method = estimated_shelf_lives[category]["method"]
                expiration_date = calculate_expiration_date(default_shelf_life, metrics)
                min_shelf_life = default_shelf_life
                max_shelf_life = default_shelf_life
            else:
                min_shelf_life = "Not available"
                max_shelf_life = "Not available"
                method = "Not available"
                metrics = "Not available"

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "product_name": product_name,
                    "category": category,
                    "expiration_date": expiration_date,
                    "min_shelf_life": min_shelf_life,
                    "max_shelf_life": max_shelf_life,
                    "metrics": metrics,
                    "method": method,
                }
            ),
        }

    except urllib.error.URLError as e:
        return {
            "statusCode": 500,
            "body": json.dumps(f"Error fetching product data: {str(e)}"),
        }
