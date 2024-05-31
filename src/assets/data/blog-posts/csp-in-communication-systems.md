#

## Communicating sequential processes (CSP)

CSP is a formal language for describing patterns of interaction in concurrent systems. It is a member of the family of mathematical theories of concurrency known as process algebras, or process calculi, based on message passing via channels. CSP was highly influential in the design of the occam programming language, and also influenced the design of programming languages such as Limbo, and Go. CSP was first described in a 1978 paper by Tony Hoare, the inventor of Quicksort.

The formalism of CSP is a model of computation that treats communication as the fundamental concept. The model is based on the notion of communication between different processes, which are mathematical abstractions representing real world processes. The processes can be in one of several states, and can communicate with each other by sending and receiving messages. The model is based on the idea of a channel, which is a communication medium that allows processes to send and receive messages.

With CSP, the communication between processes is explicit, and the processes are independent of each other. This makes it easier to reason about the behavior of the system, and to verify that it is correct. For this reason, CSP has been used to verify the correctness of many systems, including hardware designs, operating systems, and communication protocols.

## How CSP works

The notation of CSP may look a bit strange at first, but it is actually quite simple.

Simple operations in CSP include:

```markdown
`->` indicates a sequence of actions
`||` indicates parallel composition
`!` denotes sending a message
`?` denotes receiving a message
```

Lets look at a simple example of a process counting numbers and a process printing those numbers using these operations:

We define two processes, `P` and `C`. `P` is a producer that sends continuous messages to `C`, a consumer. `C` does nothing but process the messages it receives.

We assume that a channel `ch` is used to communicate between `P` and `C`.

1. The producer `P` sends a number `n` to the channel `ch`. `P(n) = produce(n) -> ch!n -> P(n+1)`. Here `produce` is an abstraction of producing **internally** in `P` a number `n`. `ch!n` denotes sending the message `n` to the channel `ch`.

2. The consumer `C` receives the message `n` from the channel `ch`. `C = ch?n -> print(n) -> C`. Here `print` is an abstraction of print **internally** in `C` the number `n`. `ch?n` denotes receiving the number `n` from the channel `ch`.

3. System `S` can be defined as `S = P(0) || C`. Here `||` denotes parallel composition. `S` is a parallel composition of `P` and `C`.

You can now execute the system `S` and a CSP Trace like this will be generated:

```markdown
produce(0) -> ch!0 -> produce(1) -> ch!1 -> produce(2) -> ...
ch?0 -> print(0) -> ch?1 -> print(1) -> ch?2 -> ...
```

This is a simple example of how CSP works. CSP can be used to model complex systems with multiple processes and channels. There are far more advanced concepts in CSP like `choice`, `recursion`, `interleaving`, `timeout`, etc. that can be used to model complex systems.

## Primitive operations in CSP

There are two classes of primitive in the CSP process algebra: **Events** and **Primitive Processes**.

Events represent communications or interactions. They are assumed to be indivisible and instantaneous. They may be atomic names (e.g. on, off), compound names (e.g. valve.open, valve.close), or input/output events (e.g. mouse?xy, screen!bitmap).

Primitive processes represent fundamental behaviors: examples include STOP (the process that communicates nothing, also called deadlock), and SKIP (which represents successful termination).

## Algebraic operations in CSP

In the next section, we will look at advanced concepts in CSP and use a more mathematical approach to understand them.

> [!WARNING]
> I will not cover the algebraic operations laws here. We will not do any proofs or anything like that. We will just look at the concepts and how they can be used to model complex systems.

![Mathematics is hard](assets/images/blog/csp-in-communication-systems/sg-maths.jpg)

It may suck a little that we have to go into maths but it will be worth it.

### Choice

Choice is a powerful concept in CSP. It allows a process to make a choice between different actions. For example, a process can choose to send a message on one channel or another, depending on some condition. This can be used to model complex systems where different actions are possible depending on the state of the system.

The first kind of choice is called **deterministic (external) choice**, denoted by $\square$. In deterministic choice, a process can choose between different actions, depending on the state of the system. For example, a process can choose to send a message on one channel or another, depending on some condition.

This is an abstract idea but lets understand it with an example (excuse the C++ code I did not test it but I hope you get the idea):

```c
#include <iostream>

class Producer {
    bool* a;
    bool* b;

    public:
        Producer(bool* a, bool* b) : a(a), b(b) {}

        void produce() {
            std::cout << "produce" << std::endl;
            *a = true;  // Set the value pointed to by a to true
            *b = false; // Set the value pointed to by b to false
        }
};

class Consumer {
    bool* a;
    bool* b;

    public:
        Consumer(bool* a, bool* b) : a(a), b(b) {}

        void consume() {
            std::cout << "consume" << std::endl;
            *a = false; // Set the value pointed to by a to false
            *b = true;  // Set the value pointed to by b to true
        }
};

class System {
    Producer p;
    Consumer c;
    bool a;
    bool b;

    public:
        System() : a(false), b(false), p(&a, &b), c(&a, &b) {}

        void run() {
            while (true) {
                if (!a && !b) {
                    break; // If both a and b are false, exit the loop
                } else if (a) {
                    p.produce();
                } else if (b) {
                    c.consume();
                }
            }
        }
};

int main() {
    System system;
    system.run();
    return 0;
}

```

This code can be treated as a deterministic choice in CSP. The system can either produce a number or consume a number depending on the value of `a` or `b`. So the environment has an influence on the choice made by the process.

This can be represented in CSP as

> $a \rightarrow P \square b \rightarrow Q$

Or as a tree:

![Deterministic choice](assets/images/blog/csp-in-communication-systems/d-choice.png)

We can extend the previous example to have the choice to stop after sending `c` messages to the channel.

> $P(n, c) = \newline$
>
> $(c > 0) \And \text{produce(n)} \newline$
>
> $\rightarrow \text{ch}!n \newline$
>
> $\rightarrow(c > 0 \And P(n+1,c-1)) \square (c == 0 \And \text{STOP}) \newline$

Lets break this down:

$P(n, c)$ is a process that takes two arguments, $n$ and $c$. $n$ is the number to start producing from and $c$ is the number of messages to produce.

$(c > 0) \And \text{produce(n)}$ is a condition that checks if $c$ is greater than 0 and if it is, it produces a number $n$.

$\text{ch}!n$ sends the number $n$ to the channel $ch$.

$(c > 0 \And P(n+1,c-1)) \square (c == 0 \And \text{STOP})$ is the choice. If $c$ is greater than 0, it continues producing numbers. If $c$ is 0, it stops.

The other kind of choice is called **non deterministic (internal) choice**, denoted by $\sqcap$. In non deterministic choice, a process can choose between different actions, without any condition. This means the environment has no influence on the choice made by the process. We call this also arbitrary choice.

This choice may sound a bit strange at first, when keeping in mind that non deterministic actions are hard to model in real world systems. But you can really think of it like this:

```python
if x:
    p()
else:
    q()
```

This python code can be translated to a CSP process like this since we dont know the value of the internal variable `x` at runtime:

> $P \sqcap Q$

Or as a tree:

![Non deterministic choice](assets/images/blog/csp-in-communication-systems/non-d-choice.png)

Lastly there is the **conditional choice** denoted by $\lhd \text{boolean} \rhd$. This choice is quiet different from the previous two. It allows a process to make a choice between different actions, depending on some condition. This is a powerful concept in CSP, as it allows a process to make decisions based on the state of the system.

This choice combined with the previous two can be used to model complex systems where different actions are possible depending on the state of the system. Lets imagine the following example:

![Chessboard](assets/images/blog/csp-in-communication-systems/chessboard.svg)

Lets say you want to model every possible movement of a king on a chessboard. You can use conditional choice to model this. The king in chess can move in any direction but only one step at a time. With a approach using no choices, you would have to model every possible movement of the king. This means:

> $\text{For } 0<x, y<7: \newline$
>
> $C(x,y) = up \rightarrow C(x,y+1) \newline$
>
> $| down \rightarrow C(x,y-1) \newline$
>
> $| left \rightarrow C(x-1,y) \newline$
>
> $| right \rightarrow C(x+1,y) \newline$

This only models the movement for one case and still misses:

> $x = y = 0 \newline$
>
> $x = 0, y = 8 \newline$
>
> $x = 8, y = 0 \newline$
>
> $x = 8, y = 8 \newline$
>
> $x = 0, 0 < y < 7 \newline$
>
> ...

This is a lot of work and not very efficient. With conditional choice you can model this in a more efficient way:

> $C(x,y) = up \rightarrow C(x,y+1) \lhd y < 7 \rhd \text{STOP} \newline$
>
> $\square down \rightarrow C(x,y-1) \lhd y > 0 \rhd \text{STOP} \newline$
>
> $\square left \rightarrow C(x-1,y) \lhd x > 0 \rhd \text{STOP} \newline$
>
> $\square right \rightarrow C(x+1,y) \lhd x < 7 \rhd \text{STOP} \newline$

This models the movement of the king in a more efficient way. The conditional choice allows to terminate the process if the condition is not met and choose the correct action based on the condition. As you can see, the action taken is based on an event. So when the up event is taken, $C(x,y+1) \lhd y < 7 \rhd \text{STOP}$ is executed. Then in here the conditional choice is made. If $y$ is less than 7, the process stops. If $y$ is greater than 7, the process continues and calls itself recursively.

This is a simple example of how conditional choice can be used to model complex systems in coorperation with the other choices.

I was lying when I said this was simple, but I hope you get the idea. We will look at more advanced concepts in CSP in the next section.

![MFW internal choice is a pain](assets/images/blog/csp-in-communication-systems/kuroko-anime.gif)

### Interleaving

Interleaving is another powerful concept in CSP. It allows to model the concurrent execution of multiple processes where the order of execution is not fixed. This means the orders of any process can occur in any order.

This can be represented in CSP as:

> $P ||| Q$

Those mathematical definitions are a bit hard to understand so lets look at an example. Lets say you want to create a fax machine. First we can create a process that roughly describes the fax:

> $\text{FAX} = \text{accept}?d : \text{DOCUMENT} \rightarrow \text{print}!d \rightarrow FAX$

This process listens to the channel `accept` for a document `d`. When it receives a document, it prints the document and then listens for the next document.

Now imagine you want to have multiple fax machines connected to the same telephone line. For this you can use interleaving:

> $\text{FAXES} = (\text{FAX1} ||| \text{FAX2}) ||| (\text{FAX3} ||| \text{FAX4})$

The system `FAXES` can now accept four faxes before printing them now.

### Generalised Parallel Composition

Sometimes you have processes and want to synchronize some events between them. This can be done with generalised parallel composition. This is a powerful concept in CSP.

This can be represented in CSP as:

> $P [|X|] Q$

Here $X$ is a set of events that are synchronized between $P$ and $Q$.

Imagine a really simple example here that gets the point accross perfectly. You need to model a race between multiple runners.

![Race](assets/images/blog/csp-in-communication-systems/race.gif)

First we can model a single runner that starts the race and finishes it:

> $\text{RUNNER} = \text{start} \rightarrow \text{finish} \rightarrow \text{STOP}$

They both have to start at the same time but they can finish at different times. This can be represented in CSP with generalised parallel composition:

> $\text{RACE} = \text{RUNNER} [| \text{start} |] \text{RUNNER}$

### Relabelling

Relabelling is like the name suggest a way to rename events in CSP. This can be useful when you want to model a system but the events name change.

We have our runner from the previous example.

> $\text{RUNNER} = \text{start} \rightarrow \text{finish} \rightarrow \text{STOP}$

The universe was previously $\Sigma = \{\text{start}, \text{finish}\}$.

![Depressed runner](assets/images/blog/csp-in-communication-systems/sad-uma.gif)

The RUNNER has changed, he is now depressed and does not want to run anymore. Lets rename the events:

The new universe is $\Sigma' = \{\text{cry}, \text{sleep}\}$.

We can define a relabeling function $f$ that maps the old events to the new events:

> $f(\text{start}) = \text{cry} \newline$
>
> $f(\text{finish}) = \text{sleep}$

Now we can relabel the RUNNER process:

> $\text{RUNNER}_f = \text{cry} \rightarrow \text{sleep} \rightarrow \text{STOP}$

This is a finally a really easy concept to understand, right? This is the case when the universe have the same number of events. In the case there are more events in the new universe, things get a bit more complicated.

Let's consider a scenario where the runner has more complex behaviors, and the new universe includes additional events. Suppose the new universe is:

> $\Sigma' = {\text{cry}, \text{sleep}, \text{rest}, \text{eat}}$

Then we create a relabeling function $f$ that maps the old events to the new events:

> $f(\text{start}) = \text{cry} \newline$
>
> $f(\text{finish}) = \text{sleep} \newline$
>
> $f(\text{start}) = \text{rest} \newline$
>
> $f(\text{finish}) = \text{eat}$

Now we can relabel the RUNNER process:

> $\text{RUNNER}_f = (\text{cry} | \text{rest}) \rightarrow (\text{rest} | \text{eat}) \rightarrow \text{STOP}$

I hope you get the idea.

### Hiding

Hiding allows to hide events in CSP. This can be useful when you want to model a system but some events are not visible to the outside world.

Imagine you have a noisy vending machine.

> $\text{VENDING} = \text{coin} \rightarrow \text{noise} \rightarrow \text{drink} \rightarrow \text{VENDING}$

You want to model the vending machine but you do not want to show the noise it makes when it dispenses a drink. You can hide the noise event.

> $\text{VENDING} \setminus \lbrace \text{noise} \rbrace = \mu X.\text{coin} \rightarrow \text{drink} \rightarrow X$

Hiding is useful to hide components of a system that are not relevant to the outside world.

### Piping

This is a really short one. Piping is just to model processes that have an input and an output channel.

> $\text{P} >> \text{Q} = (P[x / \text{out}] [|c|] Q[c / \text{in}]) \setminus c$, where $c$ is a new channel.

### Sequential Composition

Sequential composition is a way to model processes that have to be executed in a specific order. This can be useful when you want to model a system where the order of execution is important.

![Relay Race](assets/images/blog/csp-in-communication-systems/relay-race.webp)

Lets say you have relay race. So runner 1 has to *terminate* before runner 2 can *start*. As a reminder, the runner process is:

> $\text{RUNNER} = \text{start} \rightarrow \text{finish} \rightarrow \text{STOP}$

Now we can model a relay race:

> $\text{RELAY} = \text{RUNNER} ; \text{RUNNER}$

This means that the first runner has to finish before the second runner can start. If the first runner does not finish, the second runner will never start. If you want to model relay race hell itself, you can do this:

> $\text{RELAY} = \text{RUNNER}*$

This means that the after a runner finishes, a new runner starts. This is repeated **indefinitely**.

## Traces

Traces are a way to represent the behavior of a system in CSP. A trace is a sequence of events that occur in a system. When two processes generate the same traces, they are considered equivalent. This is a useful concept because this way you can do verification of systems. They are also affected by the algebraic operations we have seen before.

A possible trace of the `RELAY` system we have seen before is:

> $\lbrace\text{start}, \text{finish}, \text{start}, \text{finish} \rbrace$

This is a simple example of how traces can be used to represent the behavior of a system in CSP. Since CSP is about parallel processes, traces can be used to represent the behavior of multiple processes running in parallel. There are multiple possible traces for a system, depending on the order of execution of the processes.

> $traces(a \rightarrow b \rightarrow STOP) = \lbrace <>, <\text{a}>, <\text{a}, \text{b}> \rbrace \newline$
>
> $traces(a \rightarrow STOP \square b \rightarrow STOP) = \lbrace <>, <\text{a}>, <\text{b}> \rbrace$

From the second trace you can see that $traces(P \square Q) = traces(P) \cup traces(Q)$. This is not the only denotation that be used to represent traces. There are several other operations that can be done with traces. I will leave this to you to explore for now. Traces play a big role in the verification of systems. This can be used in model checking to verify the correctness of a system. Traces are not a concept that is unique to CSP. They are used in other formal methods as well, looking at *Labelled transition systems (LTS)*. In LTS traces are used to express equivalence between systems. This is not the only kind of equivalence used in LTS but it is a common one.

Understanding traces and its limits is important. While I dont want to go deep into the algebra of traces I want to motivate where trace equivalence does not describe the same system:

![Trace Equivalent Systems](assets/images/blog/csp-in-communication-systems/trace-eq.png)

The two systems try to describe a system in which a person opens a door and then either wins a prize behind the door or loses and gets nothing.

Lets look at them as a CSP process:

> $P_{left} = (\text{opendoor} \rightarrow \text{win} \rightarrow STOP) \sqcap  (\text{opendoor} \rightarrow \text{lose} \rightarrow STOP) \newline$
>
> $P_{right} = \text{opendoor} \rightarrow (\text{win} \rightarrow STOP \square \text{lose} \rightarrow STOP)$

The two systems are trace equivalent. They both produce the traces $\lbrace <\text{opendoor}, \text{win}>, <\text{opendoor}, \text{lose}> \rbrace$ But they are not equivalent. The left system is correct game. After choosing a door, the decision is locked in and the prize is revealed. The right system rather describes a game where the person opens the door and then can decide if they want to win or lose. So both systems do quite different things. This is a limitation of trace equivalence.

You will still see traces used in verification of systems. Sometimes strict equivalence is not needed and traces are enough to verify the correctness of a system.

## Conclusion

![MFW internal choice is a pain](assets/images/blog/csp-in-communication-systems/kuroko-anime.gif)
