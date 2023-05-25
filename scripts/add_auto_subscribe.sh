#!/bin/bash
# Bash version for times nodejs is not installed on component
trigger_file='add_user_subscription_on_register-trigger.sql'
docker compose cp "$(pwd)/${trigger_file}" db:/${trigger_file} 
docker compose exec db sh -c "MYSQL_PWD=\$MYSQL_ROOT_PASSWORD mysql \$MYSQL_DATABASE < ${trigger_file}"