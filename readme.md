

# The structure
The idea is that you have a node server that serves up the main html and client js to the user from the /public folder.
This simple page has clever js (socket.io) that connects it to the beefy node server.js you have running.

They all communicate by IPs and ports, in my case it's set up on my ubuntu server VM with:
Node server running on:   192.168.1.127:1112

# What to install
First, get a copy of ubuntu server running in virtualbox or whatever.

# Jam the files in
mkdir cradio
sudo chmod 777 cradio
# Now FTP in all the cradio folder over to your virtual machine


# We'll run a node server to do all the heavy lifting, so let's set that up now..


# Install node
sudo apt-get install nodejs
sudo apt-get install nodejs-legacy

# This is for running in a VM it MUST be in the native filesystem, NOT a shared directory!
sudo npm install youtube-dl -g
sudo npm install youtube-dl
sudo npm install youtube-node
sudo npm install express
sudo npm install socket.io

# Make sure /public is chmod 755
sudo chmod 755 public

# Open port for socket.io
sudo ufw allow 1112/tcp

# Your apache site can now connect to this node server on port 1112, and is accessable at:
whatever-your-vm-ip-is:1112


#VAGRANT STUFF: Insanity Edition

This is some bullshit gotcha with vagrant that I haven't got figured out yet, but just go with me.

So first, you wanna build the VM. This is presuming you have Virtual Box installed on your machine. 

Simply open up a command window in your cradio directory and run

```
vagrant up
```

The run time you run this, you'll see a bunch of stuff installing.

__If you start getting errors along the lines of 'Authentication Failed: Retrying...'__ then you have to do some finicky bullshit. 

(I *think* this is to do with us using the Ubuntu Box, and the Ubuntu guys not updating their box to
match the latest config requirements of Vagrant? Or something? Fuck knows)

Go wherever your boxes download to. This is probably

```
C:\Users\USERNAME\.vagrant.d\boxes
```

but honestly, at this point, who knows, and delete a file called

```
insecure_private_key
```

Then you should be able to 

```
vagrant up
```

properly.


