JamCircle
=========

JamCircle is an app for online jamming.  It uses an unusual approach to sync up
the players.  All of the players are arranged in a line, and everyone can hear
and see the players who come before them.  This avoids issues with latency,
because you can't hear the players that are "in the future".

At any time, a player can jump to the end of the line.  Jumping to the end will
introduce a small delay for that player, as they wait to catch up with the
future players, but this delay will only be noticable to the player who is
skipping forward.

Players can decide whether they want to solo or not.  If not, they will
automatically jump to the end of the line when it is their turn for a solo.
 
This software is currently just a prototype; to run it, you need to install
quasar, and run quasar dev -o.


Future ideas
============

* Starting jam session with a recording
* Recording individual parts and whole jam to a file (or a live stream)
* Superuser that can control order, etc
* Waiting room with chat, etc
* More options for controlling delay and start-early

