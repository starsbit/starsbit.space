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

This can be represented in CSP as:

$a \rightarrow P \square b \rightarrow Q$

Or as a tree:

![Deterministic choice](assets/images/blog/csp-in-communication-systems/d-choice.png)

We can extend the previous example to have the choice to stop after sending `c` messages to the channel.

---
$P(n, c) =$

$(c > 0) \And \text{produce(n)}$

$\rightarrow \text{ch}!n$

$\rightarrow(c > 0 \And P(n+1,c-1)) \square (c == 0 \And \text{STOP})$

---

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

$P \sqcap Q$

Or as a tree:

![Non deterministic choice](assets/images/blog/csp-in-communication-systems/non-d-choice.png)

I was lying when I said this was simple, but I hope you get the idea. We will look at more advanced concepts in CSP in the next section.

![MFW internal choice is a pain](assets/images/blog/csp-in-communication-systems/kuroko-anime.gif)
