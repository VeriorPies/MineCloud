function get_current_connection_count()
{
    local  mcCons=$(netstat -anp | grep :25565 | grep ESTABLISHED | wc -l)
    echo "$mcCons"
}