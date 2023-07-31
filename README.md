# AhKuKalc
 Calculator Chatbot for WWY

## Purpose
Chatbot which interacts via WhatsApp group chat to:
1. Provide a well structured equation for WWY to solve
2. Interpret the response and verify the evaluation
3. Determine if the given equation is the same as the equation by WWY
4. Determine if the evaluation by WWY is correct
5. Provide the feedback emoji
6. Repeat

## Architecture
* Application will be a Tampermonkey Javascript which interacts with WhatsApp Web
* No local database required
* Logic will be within the script itself

## Functions

### Equation Generator
Input: 
* None

Requirements:
1. Between 2 to 5 elements, with a higher probability at 3-4 elements 70% of the time
2. Operator will be addition (for now)
3. Trailing "equals" or "="
4. Numbers between 1 to 12 inclusive
5. Numbers are randomly chosen, higher probability for the smaller (<6) numbers
6. Numbers are randomly represented in numerical or word form ( 5 or five )
7. No repeating numbers (e.g. 3 + four plus 4 =) - Confuses WWY
8. Consistent spacing between tokens

Output:
* Returns a string equation to be solved

Examples:
* "one plus 3 + 5 ="
* "1 + three + five equals"
* "two plus three ="

### Equation Parser
Input:
* String representing an equation 

Requirements
1. Parse out the tokens of the string
2. Translates the characters or words into numerical integer values
3. If string evaluation is not given, then report it as -1

Output:
* A tuple representing:
  1. A list of integers representing the equation to be solved
  2. The string evaluation value 

Example:
* "one plus 3 + 5 = " -> ( [1,3,5], -1 )
* "one plus 3 + 5 = 9" -> ( [1,3,5], 9 )
* "1 + three + five equals six" -> ( [1,3,5], 6 )


### Equation Evaluator

Input:
* List of integers

Requirements:
1. Goes through the numbers and sums it up

Output:
* Sum of the list of numbers

Example:
* [1,3,5] -> 9
* [-2,4,6] -> 8

### Response 

Input:
* QuestionEquation string
* WWYEquation string and WWYvalue

Requirements:
1. EquationEvaluator the QuestionEquation to an integer
2. EquationEvaluator the WWYEquation to an integer
3. Compare the results in these criteria
   * is the WWYEquation the same as QuestionEquation
      * compare the list elements of 1 and 2
      * compare the value results of 1 and 2
   * did WWYEquation provide a solution (WWYvalue > -1)
   * is WWYvalue the same as QuestionEquation value
4. Represented as a Tuple

Output:
* Returns a tuple of booleans:
   * ( ElementsAreSame, ValuesAreSame, SolutionProvided, EvaluationCorrect )

Examples:
* ( "one plus 3 + 5 = ", "1+3 +5= 10" ) -> (true, true, true, false)
* ( "1 + three + five plus six=", "1+ 5 + three+6 = 15") -> ( false, true, true, true )
* ( "two +4 + 9=" , "2 + 4 = 6" ) -> ( false, false, true, false ) 
