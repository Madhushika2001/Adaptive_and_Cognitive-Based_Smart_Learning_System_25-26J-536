from pymongo import MongoClient

client = MongoClient("mongodb+srv://dinusha:dinusha123@cluster0.z97ayep.mongodb.net/")
db = client["learningPPlatform"]
lecture_collection = db["lectures"]
