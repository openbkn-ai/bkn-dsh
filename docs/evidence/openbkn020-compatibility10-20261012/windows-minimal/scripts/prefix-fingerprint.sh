# usage: prefix-fingerprint.sh <prefixDir> <label>  -> file count, newest mtime, tree hash (path+sha) of the prefix
P="$1"; L="$2"; cd "$P" 2>/dev/null || { echo "$L: prefix missing"; exit 0; }
N=$(find . -type f | wc -l); M=$(find . -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1)
H=$(find . -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | cut -c1-64)
echo "$L utc=$(date -u +%FT%TZ) files=$N newestMtimeEpoch=$M treeSha256=$H"
