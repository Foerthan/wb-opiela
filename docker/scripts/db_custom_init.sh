mysql -u root --password=$MYSQL_ROOT_PASSWORD -e 'create database whitebox'
mysql -u root --password=$MYSQL_ROOT_PASSWORD whitebox < home/data.sql