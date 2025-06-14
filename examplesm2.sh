#!/bin/bash

#################################
# Initializing global variables #
#################################

# Allow the user to specify path to the data directory if they want to put it
# somewhere else. $GRIND_DATA is then the path to the grind.data file
if [ -z "$GRIND_DATA_DIR" ]; then
	GRIND_DATA=grind.data
else
	GRIND_DATA="$GRIND_DATA_DIR/grind.data"
fi

# Colors for highlighting
RED='\033[0;31m'
BLUE='\033[0;34m'
CLEAR='\033[0m'

# Usage string to be printed whenever user enters an unrecognized option or
# enters the 'help' option.
USAGE=$(cat <<-END
	Usage: $(basename $0) [${BLUE}options${CLEAR}]
	Run \`$(basename $0)\` without any arguments to start your review session.
	Options:
	    ${BLUE}status${CLEAR}  Print total number of problems and number of due problems.
	    ${BLUE}help${CLEAR}    Prints this help message.
END
)

# String to show to the user to remind them what the different grades mean.
GRADES_INFO=$(cat <<-END
	Once you have attempted it, grade it on the following scale:
	    ${RED}0${CLEAR}: Zero clue how to do it
	    ${RED}1${CLEAR}: Didn't solve, but had guesses / vaguely recalled solution
	    ${RED}2${CLEAR}: Didn't solve, but had mostly the right idea
	    ${RED}3${CLEAR}: Solved, but took significant effort / many attempts
	    ${RED}4${CLEAR}: Solved, but felt tricky or was not the best solution
	    ${RED}5${CLEAR}: Solved smoothly and easily.
END
)

###############
# Basic setup #
###############

# Change directories to the same directory as the script, because normally
# grind.data is located in the same dir relative to the script
cd $(dirname "$BASH_SOURCE")

# Create the grind.data file at the desired location if it does not exist.
if ! [ -f "$GRIND_DATA" ]; then
	touch $GRIND_DATA
fi

# Checking for options which may cause program to run differently: status,
# help, and unrecognized options.
if [ "$1" == "status" ]; then # The user ran `grind status`

	# Compute total number of problems, number of due problems
	TOTAL=$(awk 'END{print NR}' $GRIND_DATA)
	TODO=$(awk -v now="$(date +%s)" '$4<now {i++} END{print i+0}' $GRIND_DATA)

	# Print stats and exit
	echo -e "There are ${BLUE}$TOTAL${CLEAR} problems in the system, of which ${RED}$TODO${CLEAR} are due."
	exit 0

elif [ "$1" == "help" ]; then # The user ran `grind help`

	echo -e "$USAGE"
	exit 0

elif [ -n "$1" ]; then # The user ran something invalid, like `grind asdf`

	# Print the unrecognized option and then also the help
	echo -e "Unrecognized option: ${RED}$1${CLEAR}\n$USAGE"
	exit 1

fi


########################
# Read-Eval-Print-Loop #
########################

while :
do
	# Clear the terminal, just for aesthetic purposes
	clear

	# Get the current system time (in seconds). Used to figure out the interval
	# since the last review, and also saved once the review occurs.
	NOW=$(date +%s)

	# Sort the problems by due date
	sort -nk4 $GRIND_DATA -o $GRIND_DATA

	# If the earliest due problem is not due yet, then nothing's due;
	# start asking the user for more problems
	EARLIEST_DUE=$(awk 'FNR == 1 {print $4; exit}' $GRIND_DATA)
	if [ -z "$EARLIEST_DUE" ] || [ "$EARLIEST_DUE" -gt "$NOW" ]; then
		# Nothing to do
		echo -ne "There are currently no problems due for a review.\nChoose a new problem and paste the URL below:\n> ${BLUE}"

		# Read URL in by user input. If empty (e.g. user hit ctrl-D), exit
		read URL
		# Reset printing color to clear
		echo -e "${CLEAR}"

		if [ -z "$URL" ]; then
			exit 0
		fi

		# Initialize N, EF, and I as specified by the SM2 algorithm.
		N=0
		EF=2.5
		I=0
		NEWPROBLEM=true
	else
		# Use awk to load in N and EF from saved data. Compute I as current time,
		# minus last reviewed time, divided by 86400 (converting secs to days)
		URL=$(awk 'FNR == 1 {print $5; exit}' $GRIND_DATA)
		N=$(awk 'FNR == 1 {print $1; exit}' $GRIND_DATA)
		EF=$(awk 'FNR == 1 {print $2; exit}' $GRIND_DATA)
		I=$(awk -v now="$(date +%s)" 'function ceil(x){return int(x)+(x>int(x))} FNR == 1 {print ceil((now - $3)/86400)}' $GRIND_DATA)
		NEWPROBLEM=false

		# Print some stats for the user
		echo -e "The next problem due for review is\n${BLUE}$URL${CLEAR}\nLast review: $I day(s) ago\nSolve streak: $N consecutive correct solve(s)"
	fi

	# Print the message that tells user what the different grades mean
	echo -e "\n$GRADES_INFO"
	
	# This loop collects user input for the grade until its a valid number
	while :
	do
		# Try reading in grade from the user
		echo -ne "Grade: ${RED}"
		read GRADE
		echo -e "${CLEAR}"

		# If empty (e.g. Ctrl-D hit), exit
		if [ -z "$GRADE" ]; then
			exit 0
		fi

		# Checking if GRADE is in a valid format: it consists of exactly one digit,
		# and that one digit appears in the string "012345".
		if [ ${#GRADE} == 1 ] && [ "$(echo 012345 | grep $GRADE)" ]; then
			break
		fi

		# Grade was ill formatted, print error and loop
		echo -e "Invalid grade, please enter a single digit ${RED}0${CLEAR}-${RED}5${CLEAR}."
	done

	# Supermemo implementation. Based on pseudocode given in
	# https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
	if [ $GRADE -gt 2 ]; then
		if [ $N == 0 ]; then
			I=1
		elif [ $N == 1 ]; then
			I=6
		else
			I=$(awk -v "I=$I" -v "EF=$EF" 'BEGIN { printf("%.0f\n", I*EF); }')
		fi
		N=$((N+1))
	else
		N=0
		I=1
	fi
	EF=$(echo "$EF + (0.1 - (5 - $GRADE) * (0.08 + (5 - $GRADE) * 0.02))" | bc)

	# Compute the next due system time in seconds
	NEXTDUE=$(echo "$NOW + $I*86400" | bc)

	# If old problem, remove first line from file (we will be replacing it with
	# a new line containing the new N, EF, and times)
	if [ "$NEWPROBLEM" = false ]; then
		tail -n +2 "$GRIND_DATA" > "$GRIND_DATA.tmp" && mv "$GRIND_DATA.tmp" "$GRIND_DATA"
	fi

	# Append new data into file and loop
	echo "$N $EF $NOW $NEXTDUE $URL" >> $GRIND_DATA
done