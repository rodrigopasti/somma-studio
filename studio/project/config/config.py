import hashlib
import os


class Config(object):
	teste = 1


class ProductionConfig(Config):

    SOMMA_VERSION = "1.1.0"
    DEFINITIONS_DATABASE = hashlib.sha1("definitions".encode('utf-8')).hexdigest()[:7]
    DATASETS_DATABASE = hashlib.sha1("datasets".encode('utf-8')).hexdigest()[:7]
    RUN_MODE = "DEV"
    LOGS_DATABASE = hashlib.sha1("logs".encode('utf-8')).hexdigest()[:7]
    REDIS_PORT = 6379    
    ADM_DATABASE = "8c75c8037996b6632deea33e2e9112e66466be"
    MONGO_SOMMA = "localhost"
    MONGO_URI = "mongodb://somma_mongodb:27017/"
    REDIS_SERVER = "localhost"
    PATH_SOMMA = os.environ["HOME"] + "/workspace/somma-core/core/"
