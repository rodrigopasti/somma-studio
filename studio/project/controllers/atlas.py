from atlasapi.atlas import Atlas
import os
import atlasapi
import json


class AtlasApi:
    def __init__(self):
        self._atlas = Atlas(
            os.environ["ATLAS_PUBLIC"], os.environ["ATLAS_PRIVATE"], os.environ["ATLAS_GROUP"])
        self._uri = "https://cloud.mongodb.com/api/atlas/v1.0/groups/%s/whitelist/" % os.environ["ATLAS_GROUP"]

    def add_ip(self, ip, container):
        ip_list = [
            {
                "ipAddress": ip,
                "comment": container
            }
        ]
        try:
            self._atlas.network.post(self._uri, ip_list)
            return True
        except:
            return False

    def delete_ip(self, ip):
        try:
           self._atlas.network.delete(self._uri + ip)
        except json.decoder.JSONDecodeError as e:
            return True
        except atlasapi.errors.ErrAtlasNotFound:
            return False

    def retrieve_ips(self):
        return self._atlas.network.get(self._uri)
    
