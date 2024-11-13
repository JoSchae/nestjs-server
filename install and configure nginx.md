https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04
dont't forget, that you can't run two configs on the same port!

- sudo apt update
- sudp apt install nginx
- sudo ufw app list
- sudo ufw allow 'Nginx HTTP'
- systemctl status nginx
- browser: http://<localhost-ip>
- sudo mkdir -p /var/www/schaeferdevelopment/html
- sudo chown -R $USER:$USER /var/www/schaeferdevelopment/html
- sudo chmod -R 755 /var/www/schaeferdevelopment
- create a index.html inside the html folder
- sudo touch /etc/nginx/sites-available/schaeferdevelopment
- configure new nginx file
- sudo ln -s /etc/nginx/sites-available/schaeferdevelopment /etc/nginx/sites-enabled/

(after installing nestjs)

- npm install -g pm2
- ufw enable
- ufw allow ‘Nginx Full‘

server {
server_name your_domain www.your_domain;
location / {
proxy_pass http://localhost:3000;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
}
}

- sudo ln -s /etc/nginx/sites-enabled/your_domain /etc/nginx/sites-available/
- pm2 start dist/main.js --name <application_name>
- sudo env PATH=$PATH:/home/johannes/.nvm/versions/node/v21.6.2/bin /home/johannes/.nvm/versions/node/v21.6.2/lib/node_modules/pm2/bin/pm2 startup systemd -u johannes --hp /home/johannes

we also need SSL for prod

https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

- sudo apt-get install gnupg curl
- curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
- echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
- sudo apt-get update
- sudo apt-get install -y mongodb-org
- sudo chown -R mongodb:mongodb /var/lib/mongodb
- sudo chown -R mongodb:mongodb /var/log/mongodb
- sudo systemctl start mongod
- sudo systemctl status mongod
- sudo systemctl enable mongod (to enable mondod on startup)
- https://www.mongodb.com/docs/manual/administration/security-checklist/#std-label-security-checklist
- mongosh
- user admin
- db.createUser({ user:"owner", pwd:"acht56sieben", roles: [{role:"dbOwner", db:"all"}]}) (any user)
- db.createUser({ user:"admin", pwd:"acht56sieben", roles: [{role:"userAdminAnyDatabase", db:"admin"}]}) (admin)
- mongosh --authenticationDatabase "admin" -u "admin" -p

- cloudflare api token: FdwRv1hU3bzpDnPdJyyL-oYCEQooCYG89YZAkOw5
