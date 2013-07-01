mvtapi
=====

#Usage
node app.js --project=homepage

Options:
--port=5000
--http_proxy=www-cache.reith.bbc.co.uk
--http_proxy_port=80

Defaults:
port: 3000
http_proxy: null
http_proxy_port: null

node app.js --project=homepage --http_proxy=www-cache.reith.bbc.co.uk --http_proxy_port=80

#mongodb
========
sudo mongod --logpath /var/log/mongodb.log --dbpath /data/db/ --fork

nohup node simple-server.js > output.log &
mongod --dbpath=/var/lib/mongodb --logpath=/var/log/mongodb/mongodb.log
