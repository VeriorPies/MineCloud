function get_current_connection_count()
{
    local mcCons=$(sudo timeout 300 tcpdump -c 1 udp port 25565 2>/dev/null)

    if [[ -z $mcCons ]]; then
        echo 0
    else
        echo 1
    fi
}
