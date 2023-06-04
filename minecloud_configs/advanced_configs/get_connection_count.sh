function get_current_connection_count()
{
    # Check for TCP connection on port 25565
    local  mcCons=$(netstat -anp | grep :25565 | grep ESTABLISHED | wc -l)
    echo "$mcCons"
}