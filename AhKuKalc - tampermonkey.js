// ==UserScript==
// @name         WhatsApp Interface for AhKuKalc
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Chatbot to provide simple addition problems and feedback for young brains
// @author       Yoon-Kit Yong
// @match        https://web.whatsapp.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.5.1.min.js#sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=
// @run-at       document-idle
// ==/UserScript==

//const delay = ms => new Promise(res => setTimeout(res, ms));
const numbers = { "zero" : 0, "one" : 1, "two": 2, "three": 3, "four": 4, "five":5, "six":6, "seven": 7, "eight":8,
                 "nine":9, "ten":10, "eleven":11, "twelve":12, "thirteen":13, "fourteen":14, "fifteen":15 }
const operators = { "equals": "=", "equls": "=", "equal": "=", "plus": "+", "add": "+",
                   "subtract": "-", "minus": "-", "takeaway": "-", "multiply": "*", "times": "*", "divide": "/" }
const flip = (data) => Object.fromEntries(
  Object
    .entries(data)
    .map(([key, value]) => [value, key])
  );
const numbersflipped = flip(numbers)

function addbits(s)
{
    // https://stackoverflow.com/questions/2276021/evaluating-a-string-as-a-mathematical-expression-in-javascript
    // 230802 yky Copied "3+4-2+4+3"->12
    return (s.replace(/\s/g, '').match(/[+\-]?([0-9\.]+)/g) || [])
        .reduce(function(sum, value) {
            return parseFloat(sum) + parseFloat(value);
        });
}

function parseEquation( equation )
{
    /* Parses the responses and evaluates the accuracy
     * 230802 yky Created
    */
    var equalsval = NaN
    var lhs = []
    var isEquation = false
    var equalsverified = NaN
    var rateComplex = 0

    equation = equation.toLowerCase()
    for (let opstr in operators) equation = equation.replaceAll( opstr, operators[opstr]+" " )
    for (let numstr in numbers) equation = equation.replaceAll( numstr, numbers[numstr]+" " )
    equation = equation.replaceAll("  ", " ")
    equation = equation.replaceAll(" ", "")

    let equals = equation.split("=")
    if ( equals.length > 0 )
    {
        lhs = equals[0]
        if (equals.length > 1) equalsval = parseInt( equals[1] )
    }

    let numelements = lhs.split("+").length
    if ( numelements > 1 )
    {
        isEquation = true
        equalsverified = addbits(lhs)

        if ( numelements > 5 ) rateComplex = 60
        else if (numelements > 4) rateComplex = 40
        else if (numelements > 3) rateComplex = 25
        else if (numelements > 2) rateComplex = 15
        else rateComplex = 10

        if (equalsverified > 25) rateComplex += 60
        else if (equalsverified > 20) rateComplex += 50
        else if (equalsverified > 15) rateComplex += 40
        else if (equalsverified > 10) rateComplex += 30
        else if (equalsverified > 8) rateComplex += 10
    }

    return [isEquation, lhs, equalsval, equalsverified, rateComplex]
}

const numpool = {0: 1, 1 : 50, 2: 55, 3: 80, 4: 90, 5: 70, 6: 50, 7: 30, 8: 25, 9: 20, 10: 10, 11: 5}

function generateNumPool()
{
    /* Creates a probability pool of numbers to be used for the addition
     * 230802 yky Created
    */
    var pool = []
    for (let i in numpool)
    {
        for (let j = numpool[i]; j>0; j--) pool.push(parseInt(i))
    }
    return pool
}

function generateEquation()
{
    /* Creates a Question Equation to be solved
     *   Additions only
     *   No consecutive numbers
     *   Random words or numerical elements and operators
     *   Between 2 to 6 elements
     * 230802 yky Created
    */
    var numelements = Math.round( 2 + Math.random()*4 )
    var elements = []
    var lastelement = 0
    var pool = generateNumPool()

    do
    {
        let newelement = pool[ Math.floor( Math.random()*pool.length ) ]

        if (newelement != lastelement)
        {
            elements.push( newelement )
            numelements--
            lastelement = newelement
        }

    } while (numelements > 0);

    var results = []
    var isWords = false
    for (let i of elements)
    {
        isWords = (Math.random()<0.5)
        if (isWords) results.push( numbersflipped[i] )
        else results.push(i)
        isWords = (Math.random()<0.5)
        if (isWords) results.push( "plus" )
        else results.push("+")
    }
    if (isWords) results[results.length-1] = "equals"
    else results[results.length-1] = "="

    var result = ""
    for (let i of results) result += i + " "

    return result // [elements, results]
}

var $ = window.jQuery; // 230729 yky Watch out for Apple problems with jQuery
var debug = -1; //230729 yky Set to -1 for production, 0 for debug

//const getChatTitle = async () =>
function getChatTitle()
{
    // 230731 yky Created
    var headers = document.getElementsByClassName("_2au8k")
    var isGroup = false
    var title = ""
    var members = ""

    if (headers.length == 1)
    {
        var divs = headers[0].getElementsByTagName("div")
        if (divs.length == 3)
        {
            isGroup = true
            title = divs[1].textContent
            members = divs[2].textContent
            if (members == "click here for contact info")
            {
                isGroup = false
                members = ""
            }
            else if (members == "click here for group info")
            {
                members = ""
            }
        }
        else if (divs.length == 2)
        {
            title = divs[1].textContent
        }
    }
    return [isGroup, title, members]
}


function ykAlert( msg, type=0 )
{
    /* Messages for debugging with varying degrees of reporting methods
     *     -1 : Dont report
     *      0 : console.log <Default>
     *      1 : window.alert (very annoying)
     * 230728 yky Created
     */
    if (type < 0) return type
    else if (type == 1) window.alert( msg )
    else console.log( msg );
    return 0;
}

const reactionEmojis = ['👍','❤️','😂','😮','😢',"🙏","+"]

const goodEmojis = { '❤️': true, '👍': true, '😍': true, '🥰': true, '🤟🏻': true,
                    '😮':false, '😢': false, '🥵': false, '❌': false, '🫣': false, '🙏': false }

function getDateTimeAuthorFromPrePlainText( preplain )
{
    /* Function to parse the WhatsApp texts which look like '[21:40, 31/07/2023] Author Name: '
     *   Into a DateTime object
     *      Date to be in DD/MM/YYYY for now
     *   Cleaned Author name
     * 230731 yky Created
    */
    var [ datetimestr, authorstr ] = preplain.replace('[','').split(']')
    var [ timestr, datestr ] = datetimestr.split(', ')
    var [ day, month, year ] = datestr.split('/')
    var datetime = new Date( year + "-" + month + "-" + day + "T" + timestr + ":00" )
    authorstr = authorstr.trim()
    return [ datetime, authorstr ]
}

function getChatTexts()
{
    /* Scans the current page for the messages
     *   DateTime
     *   Author
     *   Message
     *   Emoji - hasEmoji, charEmoji, isGoodEmoji
     * Returns the list of messages
     * 230731 yky Created
    */
    var result = []
    var seltext = document.getElementsByClassName("_11JPr selectable-text")
    for (let span of seltext)
    {
        try
        {
            if (span.classList.length > 5) continue
            var message = span.textContent
            var parent = span.parentElement.parentElement
            var isIncoming = span.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.className.includes('message-in')
            var attribute = parent.attributes['data-pre-plain-text'].textContent // "[20:53, 31/07/2023] Wong Wei Yuen: "

            var hasEmoji = false
            var charEmoji = ""
            var emoji = parent.parentElement.parentElement.parentElement.nextSibling
            if (emoji != null)
            {
                var imgs = emoji.getElementsByTagName('img')
                if (imgs.length > 0)
                {
                    hasEmoji = true
                    charEmoji = imgs[0].alt
                }
            }

            var [datetime, author] = getDateTimeAuthorFromPrePlainText( attribute )
            var sentimentEmoji = goodEmojis[charEmoji]
            let res = [datetime, author, isIncoming, message, hasEmoji, charEmoji, sentimentEmoji, span ]

            result.push( res )
        } catch(err) {
            ykAlert( err.message + ": " + span )
        }
    }
    return result
}

function clickSend(div)
{
    /* Clicks the Send button if available
     *   Usually called as a setTimeout function as the widget isnt displayed after the first text is entered into the textarea
     * 230802 yky Created
    */
	var send = null
    var i = 3
    do {
        let sends = document.getElementsByClassName("tvf2evcx oq44ahr5 lb5m6g5c svlsagor p2rjqpw5 epia9gcq")
        if (sends.length > 0)
        {
            send = sends[0]
            send.click()
        } else
        {
            div.focus()
            document.execCommand('insertText', false, ' ' ) // 230802 yky execCommand might get deprecated

        }
        //ykAlert( send )
    } while ( (send == null) & (i-- > 0) )
}

function sendMessage( text )
{
    /* Updates the textarea for messages to be sent
     *   Executes the send button
     *   Problem with div textareas is that the <p> only appears when at least one character is input
     *     Doesnt work by manipulating the innerHTML, appendChild, and textContent.
     *     Seems to work with execCommand('insertText' .. ) however this will be deprecated soon.
     *   Send button will only appear only a few milliseconds after the insertText. Needs a delay
     * 230801 yky Created
    */
    var div = document.getElementsByClassName("to2l77zo gfz4du6o ag5g9lrv bze30y65 kao4egtt")[1]
    div.focus()
    document.execCommand('insertText', false, text ) // 230802 yky execCommand might get deprecated

    setTimeout( function () { clickSend(div) }, 500 )
}

function simulateKeyPress(field, key)
{
    /* Keypresses on the elements
     *   Unfortunately these events.isTrusted == false
     * 230801 yky Created
    */
    const eventdown = new KeyboardEvent('keydown', { 'key': key });
    const eventup = new KeyboardEvent('keyup', { 'key': key });
    field.focus();
    field.dispatchEvent(eventdown);
    field.dispatchEvent(eventup);
}

var clickDelay = 3500

function clickEmoji( span, emoji )
{
    /* Reveals the available emojis and clicks on the appropriate one given the span of text
     * 230802 yky Created
     */
    const mouseOverEvent = new MouseEvent('mouseover', { view: window, bubbles: true, cancelable: true } )
    span.dispatchEvent(mouseOverEvent)
    // pause
    setTimeout( function () {clickEmoji_ClickGreyFace( span, emoji )}, clickDelay )

    function clickEmoji_ClickGreyFace( span, emoji )
    {
        var div = span.parentElement.parentElement.parentElement
        var emo = div.parentElement.nextSibling
        var emoc = emo.firstChild.firstChild.firstChild
        emoc.click()
        // pause
        setTimeout( function () {clickEmoji_ClickReaction( emoji )}, clickDelay )
    }

    function clickEmoji_ClickReaction( emoji )
    {
        /* Clicks on the revealed emojis available for the particular span
         *    reaction-option-0 is thumbs up, 1= heart, 2=laugh
         *       3 = surprised, 4=cry, 5=prayer
         *       "show-more" is the plus
         * 230802 yky Created
        */
        var emo = document.querySelector("[data-testid='reactions-option-"+emoji+"']").click()
        return emo
    }
}

function checkAllChats()
{
    var chatlist = document.querySelector("[aria-label='Chat list']")
}

var oldtitle = ""
var oldtexts = []
var repeat = 12
var repeati = repeat

function updateWhatsApp()
{
    var [isGroup, title, members] = getChatTitle()
    //ykAlert("update")
    var texts = getChatTexts()
    var length = texts.length
    try
    {
		repeati--
		if (repeati == 0)
		{ // 230807 yky  Rechecking after x times.
			repeati = repeat
			oldtexts = [] 
		}
        if (texts.length != oldtexts.length)
        {
            ykAlert("length: " + texts.length)
            let last = texts[ texts.length -1]
            let [datetime, author, isIncoming, message, hasEmoji, charEmoji, sentimentEmoji, span ] = last

            let command = message.toLowerCase()
            if (!hasEmoji && isIncoming)
            {
                ykAlert("Needs Feedback: " + message )
                if ( command == "maths" )
                {
                    sendMessage( generateEquation() )
                } else if ( command == "laugh" )
                {
                    clickEmoji(span, 2)
                }
                else
                {
                    var [isEquation, lhs, equalsval, equalsverified, rateComplex] = parseEquation(message)
                    if (isEquation)
                    {
                        let rate = -100
                        if (!isNaN(equalsval))
                        {
                            if (equalsval == equalsverified) rate = rateComplex
                            else rate = -10
                        }
                        if (rate < -50) clickEmoji( span, 4 )
                        else if (rate < 0) clickEmoji( span, 3 )
                        else if (rate > 95) clickEmoji( span, 1 )
                        else if (rate > 40) clickEmoji( span, 0 )
                        else if (rate >= 0) clickEmoji( span, 5 )
                        ykAlert( [isEquation, lhs, equalsval, equalsverified, rate] )
                        if (rate > 0) setTimeout( function () { sendMessage( generateEquation() ) }, clickDelay*3 )
                    }
                }
            }
        }
    } catch(err) {
        ykAlert( err.message )
    }
    oldtexts = texts
    oldtitle = title
}

setInterval( function () { updateWhatsApp() }, 5000)
