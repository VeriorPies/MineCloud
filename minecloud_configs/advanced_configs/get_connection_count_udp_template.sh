function get_current_connection_count()
{
    # If there's no udp package recieved on port 25565 for 10 second,
    # return an empty string, else return the package info
    local mcCons=$(sudo timeout 10 tcpdump -c 1 udp port 25565 2>/dev/null)

    # Return 0 if "mcCons" is an empty string, else 1
    if [[ -z $mcCons ]]; then
        echo 0
    else
        echo 1
    fi
}
