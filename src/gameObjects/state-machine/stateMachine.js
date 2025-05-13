export class StateMachine {
    constructor(initialState, states, context) {
        this.currentState = initialState;
        this.states = states;
        this.context = context;
        this.isTransitioning = false;
        this.queuedTransition = null;
    }
    // Exit and enter are only running/checking a single frame of the animation. Enter the first frame, and exit the last frame.
    transition(newState) {
        if (this.isTransitioning) {
            // Queue the transition if already transitioning
            this.queuedTransition = newState;
            console.log(`Queuing transition to ${newState}`);
            return;
        }

        if (this.states[newState] && this.currentState !== newState) {
            this.isTransitioning = true;
            //console.log(`Transitioning from ${this.currentState} to ${newState}`);

            // Exit current state
            if (this.states[this.currentState].exit) {
                this.states[this.currentState].exit.call(this.context);
            }
            // Update state
            this.currentState = newState;
            // Enter new state
            if (this.states[newState].enter) {
                this.states[newState].enter.call(this.context);
            }

            this.isTransitioning = false;

            // Process queued transition
            if (this.queuedTransition) {
                const nextState = this.queuedTransition;
                this.queuedTransition = null;
                this.transition(nextState);
            }
        }
    }
    // Execute is updating the entire lifetime of the animation?
    update() {
        if (this.states[this.currentState].execute) {
            this.states[this.currentState].execute.call(this.context);
        }
    }
}