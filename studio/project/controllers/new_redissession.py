import pickle
from datetime import timedelta
from uuid import uuid4
from redis import Redis
from redis.sentinel import Sentinel
from werkzeug.datastructures import CallbackDict
from flask.sessions import SessionInterface, SessionMixin
from project import app
import os

app.config.from_object('project.config.config.ProductionConfig')

class RedisSession(CallbackDict, SessionMixin):

    def __init__(self, initial=None, sid=None, new=False):
        def on_update(self):
            self.modified = True
        CallbackDict.__init__(self, initial, on_update)
        self.sid = sid
        self.new = new
        self.modified = False


class RedisSessionInterface(SessionInterface):
    serializer = pickle
    session_class = RedisSession

    def connect(self, redis, prefix='session:'):
        if redis is None:
            if app.config["RUN_MODE"] == "DEV":
                redis = Redis()
            else:
                sentinel =  Sentinel([('10.0.0.3', 26379)], socket_timeout=0.1)
                host = sentinel.discover_master('redis-primary')
                host = host[0]
                redis_pw = os.environ["REDIS_PASSWORD"]
                redis = Redis(host=host, port=6379, password=redis_pw)
        
        self.redis = redis
        self.prefix = prefix

    def generate_sid(self):
        return str(uuid4())

    def get_redis_expiration_time(self, app, session):
        if session.permanent:
            return app.permanent_session_lifetime
        return timedelta(days=1)

    def open_session(self, app, request):
        self.connect(redis=None, prefix='session:')
        sid = request.cookies.get(app.session_cookie_name)
        if not sid:
            sid = self.generate_sid()
            return self.session_class(sid=sid, new=True)
        val = self.redis.get(self.prefix + sid)
        if val is not None:
            data = self.serializer.loads(val)
            return self.session_class(data, sid=sid)
        return self.session_class(sid=sid, new=True)

    def save_session(self, app, session, response):
        domain = self.get_cookie_domain(app)
        if not session:
            self.redis.delete(self.prefix + session.sid)
            if session.modified:
                response.delete_cookie(app.session_cookie_name,
                                       domain=domain)
            return
        redis_exp = self.get_redis_expiration_time(app, session)
        cookie_exp = self.get_expiration_time(app, session)
        val = self.serializer.dumps(dict(session))
        self.redis.setex(self.prefix + session.sid,int(redis_exp.total_seconds()), val)
        response.set_cookie(app.session_cookie_name, session.sid,
                            expires=cookie_exp, httponly=True,
                            domain=domain)
