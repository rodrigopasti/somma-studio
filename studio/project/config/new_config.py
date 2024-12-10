import hashlib
import os


class Config(object):
	teste = 1


class ProductionConfig(Config):

    SOMMA_VERSION = "0.11.0"
    DEFINITIONS_DATABASE = hashlib.sha1("definitions".encode('utf-8')).hexdigest()[:7]
    DATASETS_DATABASE = hashlib.sha1("datasets".encode('utf-8')).hexdigest()[:7]
    RUN_MODE = "DEV_"
    LOGS_DATABASE = hashlib.sha1("logs".encode('utf-8')).hexdigest()[:7]
    REDIS_PORT = 6379

    if RUN_MODE == "DEV":
        ADM_DATABASE = "8c75c8037996b6632deea33e2e9112e66466be"
        MONGO_SOMMA = "localhost"
        MONGO_HOST = "localhost"
        REDIS_SERVER = "localhost"
        PATH_SOMMA = os.environ["HOME"] + "/workspace/somma-core/core/"
    else:
        #MONGO_SOMMA = "axon0-fxbyv.mongodb.net"
        ADM_DATABASE = "8c75c8037996b6632deea33e2e9112e66466be"
        MONGO_SOMMA = "sommaadm-fxbyv.mongodb.net"
        REDIS_SERVER = "10.0.0.4"
        PATH_SOMMA = "/somma-core/"
