#!/bin/bash
# Script to test timing attack on
script_name=$(basename "$0")
start=$(date +%s)
default_url='http://localhost:3000'
url="${1:-$default_url}"  # If variable not set or null, use default.
# If VARIABLE was unset or null, it still is after this (no assignment done).
default_times=100
times="${2:-$default_times}" 
echo "Running $script_name with $times iterations against $url"

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq is not installed. Attempting to install jq."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install -y jq && echo "Installation of jq completed.."
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq && echo "Installation of jq completed.."
    else
        echo "Your system is not supported for automatic installation of jq."
        echo "Please install jq manually and rerun this script."
        exit 1
    fi
fi

# Verify if jq is installed after attempting installation
if ! command -v jq &> /dev/null
then
    echo "jq could not be installed. Please install jq manually and rerun this script."
    exit 1
fi

register(){
    local reg_token
    local username_time
    username_time="user_$(date +%s%3N)"
    reg_token=$1
    response=$(curl -sk -X POST "$url/v1/users" \
    -H 'Content-Type: application/json' \
    -d '{
        "api": "20200115",
        "password": "0e3eb906710abe18c770665c5d40dfffb5a09f7e72d38e9c65de6c3550a2091d",
        "email": "'$username_time'",
        "ephemeral": true,
        "identifier": "'$username_time'",
        "pw_nonce": "f6cfb09921f45f837b0bf40b5347aede3e2f0d6e9d21c32af0e60b2c422488c5",
        "version": "004",
        "origination": "registration",
        "created": "1677246083557",
        "regToken": "'$reg_token'"
    }')

    error=$(echo "$response" | jq '.error')
    data=$(echo "$response" | jq '.data')
    # echo "response: $response"

    if [[ "$error" != "null" ]]; then
        error_message=$(echo "$error" | jq -r '.message')
        # echo "Request failed: $error_message"
    elif [[ "$data" != "null" ]]; then
        access_token=$(echo "$data" | jq -r '.session.access_token')
        # echo "Access token: $access_token"
    else
        echo "Unexpected response: $response"
    fi
}


correct_token="ABCDEFG"
exploit_attempt1="xBCDEFG"
exploit_attempt2="ABCxEFG"
exploit_attempt3="ABCDEFx"



# correct_token="c8Yov87D21kohr419d1rEi"
# exploit_attempt1="xc8Yov87D21kohr419d1rEi"
# exploit_attempt2="c8Yov87D21xohr419d1rEi"
# exploit_attempt3="c8Yov87D21kohr419d1rEx"

goodToken (){
    register "$correct_token"
}

exploit_attempt1 (){
    register "$exploit_attempt1"
}

exploit_attempt2 (){
    register "$exploit_attempt2"
}

exploit_attempt3 (){
    register "$exploit_attempt3"
}


get_average_time_goodToken(){
    start=$(date +%s)
    for ((i=0; i < times; i++)) ; do
        goodToken
    done
    end=$(date +%s)
    average_time_exploit_goodToken=$(bc -l <<< "($end - $start) / $times")
    echo "average_time_exploit_goodToken: $average_time_exploit_goodToken"
}


get_average_time_exploit_attempt1(){
    start=$(date +%s)
    for ((i=0; i < times; i++)) ; do
        exploit_attempt1
    done
    end=$(date +%s)
    average_time_exploit_attempt1=$(bc -l <<< "($end - $start) / $times")
    echo "average_time_exploit_attempt1: $average_time_exploit_attempt1"
}


get_average_time_exploit_attempt2(){
    start=$(date +%s)
    for ((i=0; i < times; i++)) ; do
        exploit_attempt2
    done
    end=$(date +%s)
    average_time_exploit_attempt2=$(bc -l <<< "($end - $start) / $times")
    echo "average_time_exploit_attempt2: $average_time_exploit_attempt2"
}

get_average_time_exploit_attempt3(){
    start=$(date +%s)
    for ((i=0; i < times; i++)) ; do
        exploit_attempt3
    done
    end=$(date +%s)
    average_time_exploit_attempt3=$(bc -l <<< "($end - $start) / $times")
    echo "average_time_exploit_attempt3: $average_time_exploit_attempt3"
}

get_average_time_exploit_attempt1
get_average_time_exploit_attempt2
get_average_time_exploit_attempt3
get_average_time_goodToken

end=$(date +%s)
echo "$script_name completed in [$(($end - $start))]seconds"