#ifndef STATEMACHINE_H
#define STATEMACHINE_H

class Transition {
	State *from,*to;
public:
	virtual void run();
};

class State {
	String statename;
public:
	Vector<Transition*> from, to, enter, exit;
	State *update(){
		// check from transition, eventually move to another state
	}
	void enter(){
		// run the enter transitions
	}
	void exit(){
		// run the exits transitions
	}
};

class DetectorMachine{
	class InitState : public State{};
	class InitState : public State{};


	DetectorMachine(){

	};
};


#endif
