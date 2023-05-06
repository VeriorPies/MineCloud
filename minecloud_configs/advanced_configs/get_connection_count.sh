function get_current_connection_count()
{
    # Check how many TCP connections on port 7777
    local  mcCons=$(netstat -anp | grep :7777 | grep ESTABLISHED | wc -l)
    echo "$mcCons"
}