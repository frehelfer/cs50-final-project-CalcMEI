# calcMEI

#### Video Demo: https://www.youtube.com/watch?v=MULFAU8pK5M

#### Website: https://calcmei.com.br/

#### iOS app: https://github.com/frehelfer/calcMEI

## Explaining the project

Hello! My name is Frédéric, I’m from Brazil and this is my final project for the CS50 course.

My project is a website to help the Brazilian individual business owner to know if they have to declare and pay the personal annual tax return or not.
The user needs to fill only 4 data inputs to have a final result with a well description count. Furthermore, there is a tutorial teaching how to fill the personal annual tax return.

I had this idea because I’m a individual business owner and in the past I had some difficult to know if I had to declare or not. I’ve searched all the Internet and I didn’t find any helpful information.

The idea was to make it very simple and direct, because I only found some complicated posts explaining the subject.

## How to launch application

#### You can access it here: https://calcmei.com.br/

or

1. Check that you have the extension Live Server.
2. Clone the code Branch: https://github.com/frehelfer/cs50-final-project-Calculadora-IRPF-MEI/tree/Live-Server-Branch.
3. Run Live Server in index.html page.
4. In your browser go to http://127.0.0.1:5500/index.html
5. You are ready to go!

## Features

I made this website with only HTML, CSS and JavaScript.
There is no database or user login, because we are dealing with private data that people would not like to share, so the calculations are all done on the client side with javascript.
I hosted and deployed it with fire-base and I intend to keep it online and up-to-date.

## Technical details

All the input tag have a mask to prevent the user inputting letters and other characters not allowed, just numbers. The mask also set the Brazilian standard semicolonand dots in the right place.

All calculations are performed automatically when typing the number.
There are four results, being:

- Gross anual income
- Profit
- Exempt profit
- Taxable profit

If the Taxable Profit is greater than R$ 35.584,00 the individual business owner have to declare and pay the personal annual tax return.

There is a message in the result container that changes according to the result.

I used javascript to capture, work with the data and show it to the user automatically.

## About CS50

CS50 is a course from Havard University taught by David J. Malan
David it’s the best teacher ever! I cannot imagine having a class like this here in Brazil.

Introduction to the intellectual enterprises of computer science and the art of programming. This course teaches students how to think algorithmically and solve problems efficiently. Topics include abstraction, algorithms, data structures, encapsulation, resource management, security, and software engineering. Languages include C, Python, and SQL plus students’ choice of: HTML, CSS, and JavaScript (for web development).

I really enjoyed all the content taught in the course, it gave me all the foundations to keep studying and learning.

Thank you for all CS50.

- Where I get CS50 course?
  https://cs50.harvard.edu/x/2022/

[LinkedIn Frédéric Helfer](https://www.linkedin.com/in/fre-helfer/)
