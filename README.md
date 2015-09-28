PhaserGame Server
=================

##Install
	git clone https://github.com/rdfriedl/phasergameserver.git
	cd phasergameserver
	npm install

##Configure
PhaserGameServer requires a mysql detabase
you can configure the connection info in <code>config.json</code>

###Set up the database
there are two sql files <code>data/dataBase-structure.sql</code> and <code>data/dataBase-data.sql</code>.
use <code>data/dataBase-structure.sql</code> to set up the database, and the optionaly <code>data/dataBase-data.sql</code> to put some example data in it.

##Running
to start the server run

	npm start

##Tools
Map editor: <a href="https://github.com/rdfriedl/phasergameadmin">PhaserGame Admin</a>