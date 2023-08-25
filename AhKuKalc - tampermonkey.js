// ==UserScript==
// @name         WhatsApp Interface for AhKuKalc
// @namespace    http://tampermonkey.net/
// @version      0.55
// @description  Chatbot to provide simple addition problems and feedback for young intellectuals
// @author       Yoon-Kit Yong
// @match        https://web.whatsapp.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @grant        none
// @require      https://code.jquery.com/jquery-3.5.1.min.js#sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/yoonkit/AhKuKalc/main/AhKuKalc%20-%20tampermonkey.js
// @downloadURL  https://raw.githubusercontent.com/yoonkit/AhKuKalc/main/AhKuKalc%20-%20tampermonkey.js
// ==/UserScript==

var verbosity = 3
document.verbosity = verbosity

function ykAlert( msg, type=0 )
{
    /* Messages for debugging with varying degrees of reporting methods
     *     -1 : Boldify
     *      0 : console.log <Default>
     *      1 : light verbose
     *      2 : medium verbose
     *      3 : very verbose
     *     10 : window.alert (very annoying)
     * 230728 yky Created
	 * 230820 yky Modified - verbosity, caller function name, indent
     */
    if (type < 0) console.log( '*** ' + msg + ' ***' )
    else if (type == 10) window.alert( msg )
    else if (type <= document.verbosity)
    {
        let fname = ""
        let caller = ykAlert.caller
        if (caller != null) fname = ' (' + caller.name + ') '
        let spacer = "-".repeat(type*2) + ": "
        console.log( spacer + msg + fname );
    }
    return 0;
}

ykAlert('AhKuKalc Script loading ...', 2)

/* =====================================  Mathematics functions ============================ */

const numbers = { "zero" : 0, "one" : 1, "two": 2, "three": 3, "four": 4, "five":5, "six":6, "seven": 7, "eight":8,
                 "nine":9, "ten":10, "eleven":11, "twelve":12, "thirteen":13, "fourteen":14, "fifteen":15,
                 "sixteen":16, "seventeen":17, "eighteen":18, "nineteen": 19, "twenty":20 }
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

    var res = [isEquation, lhs, equalsval, equalsverified, rateComplex]
    ykAlert( res, 4 )
    return res
}

const elementpool = {0: 0, 1: 0, 2: 50, 3: 100, 4: 120, 5: 60, 6: 20, 7: 3, 8: 2}
const numpool = {0: 3, 1 : 50, 2: 70, 3: 80, 4: 90, 5: 90, 6: 80, 7: 40, 8: 40, 9: 10, 10: 5, 11: 1, 12: 3, 13: 3, 14: 1, 15: 1}

function generateStatPool(statpool)
{
    /* Creates a probability pool of numbers to be used for the addition and element numbers
     * 230802 yky Created
    */
    var pool = []
    for (let i in statpool)
    {
        for (let j = statpool[i]; j>0; j--) pool.push(parseInt(i))
    }
    return pool
}

function generateStackedEquation( difficulty )
{
    /* Generates a set of easy equations without any carry over given the number of rows and cols
     *  There is a problem with WhatsApp ARIA textarea - it doesnt allow text to be input directly, and strips off the \n newlines
     * 230802 yky Created
     * 230821 yky Added difficulty settings - adds columns and rows
    */
    var elements = []
    if (difficulty == null) difficulty = 3
    var rows = 2
    var cols = 3
    if (difficulty > 50)
    {
        rows = 3
        cols = 4
    } else if (difficulty > 40)
    {
        rows = 3
        cols = 3
    } else if (difficulty > 30)
    {
        rows = 2
        cols = 5
    } else if (difficulty > 20)
    {
        rows = 2
        cols = 4
    } else if (difficulty > 10)
    {
        rows = 2
        cols = 3
    }

    elements.length = rows
    elements.fill(0)
    var bar = "--"

    for (let i = 0; i < cols; i++ )
    {
        let colsum = 10
        let factor = 1
        for (let j=0; j < rows; j++)
        {
            let element = Math.floor( Math.random()*colsum )
            if ((i == 0) && (colsum > 1))
            {
                element = Math.floor(element * 0.4) + 1
            }
            elements[j] = elements[j]*10 + element
            colsum -= element
        }
        bar += "-"
    }
    var results = ""
    for (let i = 0; i < rows; i++ )
    {
        results += elements[i]
        if (i < rows-1) results += " +\n"
        else results += " =\n" + bar
    }
    return [elements, results]
}

function generateStringEquation( difficulty )
{
    /* Creates a Question Equation to be solved
     *   Additions only
     *   No consecutive numbers
     *   Random words or numerical elements and operators
     *   Between 2 to 6 elements
     * 230802 yky Created
     * 230807 yky Added stat weighted element numpool
     * 230821 yky Added difficulty settings - increases values and element nums
    */
    var pool = generateStatPool(numpool)
    var elepool = generateStatPool(elementpool)

    var modval, modele

    if (difficulty == null)   { modval = 0; modele = 0 }
    else if (difficulty > 50) { modval = 5; modele = 2 }
    else if (difficulty > 30) { modval = 3; modele = 1 }
    else if (difficulty > 20) { modval = 2; modele = 1 }
    else if (difficulty > 10) { modval = 1; modele = 0 }
    else { modval = 0; modele = 0 }

    var numelements = elepool[ Math.floor( Math.random()*elepool.length ) ] + modele //  Math.round( 2 + Math.random()*4 )
    var elements = []
    var lastelement = 0

    do
    {
        let newelement = pool[ Math.floor( Math.random()*pool.length ) ] + modval

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

var currentdifficulty = 3
function generateEquation( difficulty )
{
	// 230820 yky Wrapper function to randomly pick different puzzles
    var result = ""
    var q = ""
    if (difficulty > 50) currentdifficulty++
    else if (difficulty < 50) currentdifficulty--
    if (difficulty == null) currentdifficulty = 3

    if ( Math.random() > 0.8 ) [ q, result ] = generateStackedEquation( currentdifficulty )
    else result = generateStringEquation( currentdifficulty )
    return result
}

/* =====================================    UI jQuery functions ============================ */

var $ = window.jQuery; // 230729 yky Watch out for Apple problems with jQuery
var debug = -1; //230729 yky Set to -1 for production, 0 for debug

function getChatTitle()
{
    /* 230731 yky Created
	 * 230820 yky Modified - capturing exceptions. just incase
	 */
    var isGroup = false
    var title = ""
    var members = ""

    ykAlert( 'Getting Chat Title', 4 )
    try
    {
        var headers = document.getElementsByClassName("_2au8k")
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
    } catch(err) {
            ykAlert( err.message + ": " + title )
    }
    ykAlert( 'Chat Title: ' + title, 2 )
    return [isGroup, title, members]
}

const reactionEmojis = ['👍','❤️','😂','😮','😢',"🙏","+"]
const scoredEmojis = { '❤️': 300, '💕': 150, '🥰': 120, '🏆': 110, '🥳': 100, '🥳': 90, '😍': 80, '🤗': 70, '👏🏾': 60, '🤟🏻': 50, '😎': 40, '🥇': 30, '👍': 20, '💪🏽': 10,
                 '🙏': -1, '😩':-10, '👎': -30, '🥴': -35, '😮':-40, '🤢': -45, '😢': -50, '🙈': -55, '💩': -58, '🥵': -60, '🥺': -65, '😭': -70, '❌': -100, '😂': -160, '☠️':-200 }

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

function getParentWithClass(element, classname)
{
    /* Wrote this because WhatsApp keeps changing the parent depth of its divs
     * Traversers up the hierarchy to find the parent class name
     * 230821 yky Created
     */
    //ykAlert( element.className )
    let parent = element.parentElement
    if (parent == null) return null
    else if (parent.className.indexOf(classname) >= 0) return parent
    else return getParentWithClass(parent, classname)
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
     * 230812 yky the 'message-in' parentElement increased
     * 230823 yky Modified - the emoji element changed from data-testid to button
    */
    var result = []
    ykAlert( 'Getting Messages', 4)
    var seltext = document.getElementsByClassName("_11JPr selectable-text")
    ykAlert( 'Total Messages: ' + seltext.length, 3 )
    for (let span of seltext)
    {
        try
        {
            if (span.classList.length > 5) continue
            var message = span.textContent
            ykAlert('Parsing ' + message, 5)
            var grandparent = getParentWithClass( span, 'message-in' )
            var isIncoming = grandparent != null

            var parent = span.parentElement.parentElement
            var attribute = parent.attributes['data-pre-plain-text'] // "[20:53, 31/07/2023] Wong Wei Yuen: "
            if (attribute == undefined) continue
            attribute = attribute.textContent // "[20:53, 31/07/2023] Wong Wei Yuen: "

            var hasEmoji = false
            var charEmoji = ""
            var emoji = null
            if (grandparent != null)
            {
                emoji = grandparent.querySelector('[data-testid="reaction-bubble"]') // 230801
                if ( emoji == null ) emoji = grandparent.querySelector('button[aria-label]') // 230823
                //if ( emoji == null ) ykAlert( 'Cannot find reaction emoji', 0)
            } //else ykAlert( 'Cannot find grandparent for chat span', 0)

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
            var sentimentEmoji = scoredEmojis[charEmoji]
            let res = [datetime, author, isIncoming, message, hasEmoji, charEmoji, sentimentEmoji, span ]

            result.push( res )
        } catch(err) {
            ykAlert( err.message + ": " + span )
        }
    }
    ykAlert( 'Got Messages: ' + result.length, 2)
    document.textMessages = result
    return result
}

function clickSend(div)
{
    /* Clicks the Send button if available
     *   Usually called as a setTimeout function as the widget isnt displayed after the first text is entered into the textarea
     * 230802 yky Created
    */
    ykAlert( 'Clicking on Send', 4)
	var send = null
    var i = 3
    do {
        let sends = document.getElementsByClassName("tvf2evcx oq44ahr5 lb5m6g5c svlsagor p2rjqpw5 epia9gcq")
        if (sends.length > 0)
        {
            send = sends[0]
            send.click()
            ykAlert( 'Send clicked', 3)
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
    ykAlert( 'Sending: ' + text, 2)
}

function fillTextBox( text )
{
	// 230820 yky Testing. Trying to inject these div/p/span into the textbox. Doesnt work
    var parent = document.getElementsByClassName("g0rxnol2 ln8gz9je lexical-rich-text-input")[1]
    var div = '<div class="to2l77zo gfz4du6o ag5g9lrv bze30y65 kao4egtt" contenteditable="true" role="textbox" spellcheck="true" title="Type a message" data-testid="conversation-compose-box-input" tabindex="10" data-tab="10" data-lexical-editor="true" style="max-height: 7.35em; min-height: 1.47em; user-select: text; white-space: pre-wrap; word-break: break-word;">'
    var divspan = '<p class="selectable-text copyable-text iq0m558w g0rxnol2" style="text-indent: 0px;" dir="ltr"><span class="selectable-text copyable-text" data-lexical-text="true">'

    var result = div
    for (let i of text.split('\n') )
    {
        result += divspan + i + '</span></div>'
    }
    return result + "</div>"
}

function simulateKeyPress(field, key)
{
    /* Keypresses on the elements
     *   Unfortunately these events.isTrusted == false
     * 230801 yky Created. Doesnt Work.
    */
    const eventdown = new KeyboardEvent('keydown', { 'key': key });
    const eventup = new KeyboardEvent('keyup', { 'key': key });
    field.focus();
    field.dispatchEvent(eventdown);
    field.dispatchEvent(eventup);
}

var clickDelay = 2000
var loadedEmojis = 0

function clickEmoji( span, score )
{
    /* Reveals the available emojis and clicks on the appropriate one given the span of text
     *      Wide range of emojis, and might require additional clicks
     * 230802 yky Created
     * 230823 yky Modified - added more emojis
     */

    var emoji = ""
    let origScore = score
    score = score + Math.floor( Math.random()*60 ) - 30
    if (( origScore < 0) && (score > 0)) score = -score
    else if (( origScore > 0) && (score < 0)) score = Math.abs( score )

    for ( let [emo, val] of Object.entries(scoredEmojis) )
    {
        if (score > val ) break
        emoji = emo
    }
    ykAlert( 'Scoring ' + score + ' with Emoji ' + emoji, 4)

    let grid = document.querySelector('._2pWdM[role="grid"]')
    if (grid != null) // 230826 yky  The grid is already up. Usually gets stuck here.
    {
        return clickEmoji_ClickMoreReaction( emoji )
    }

    const mouseOverEvent = new MouseEvent('mouseover', { view: window, bubbles: true, cancelable: true } )
    span.dispatchEvent(mouseOverEvent)
    // pause
    setTimeout( function () {clickEmoji_ClickGreyFace( span, emoji )}, clickDelay/2 )

    function clickEmoji_ClickGreyFace( span, emoji )
    {
        /* Waits for the grey emoji to appear on hover, and clicks on it
         * 230812 yky Modified - updated another div's parentElement before nextSibling
         * 230821 yky Modified - using classnames to locate the grandparent and button
        */
        ykAlert( 'Clicking on GreyFace', 5)
        //var div = span.parentElement.parentElement.parentElement
        //var emo = div.parentElement.parentElement.nextSibling
        //var emoc = emo.firstChild.firstChild.firstChild

        var grandparent = getParentWithClass( span, 'UzMP7' )
        var button = grandparent.querySelector('[aria-label="React"]')
        // var button = grandparent.querySelector('[data-testid="reaction-entry-point"]')
        if (button == null) ykAlert( 'Cant find the emoji greyface button', 0)
        else
        {
            button.click()
            setTimeout( function () {clickEmoji_ClickReaction( emoji )}, clickDelay )
        }
    }

    function clickEmoji_ClickReaction( emoji )
    {
        /* Clicks on the revealed emojis available for the particular span
         *    reaction-option-0 is thumbs up, 1= heart, 2=laugh
         *       3 = surprised, 4=cry, 5=prayer
         *       "show-more" is the plus
         * 230802 yky Created
        */
        var numStandard = reactionEmojis.indexOf( emoji )
        if (numStandard >= 0)
        {
            //var emo = document.querySelector("[data-testid='reactions-option-"+numStandard+"']")
            var emo = document.querySelector("[alt='"+emoji+"']")
            if (emo == null) ykAlert( 'Cant find the standard emoji ' + emoji + ' button at #' + numStandard, 0)
            else
            {
                emo.click()
                ykAlert( 'Clicked on "' + emoji + '" emoji ' + emo, 3)
            }
        } else {
            var more = document.querySelector('[aria-label="More reactions"]')
            if (more == null) ykAlert( 'Cant find the more emoji button', 0)
            else
            {
                more.click()
                ykAlert( 'Clicked on More Emojis', 5 )
                setTimeout( function () {clickEmoji_ClickMoreReaction( emoji )}, clickDelay*1.5 )
            }
        }
    }
    function clickEmoji_ClickMoreReaction( emoji )
    {
        /* Clicks on the specific emoji from the long list of emojis
         *      There may be issues with emojis down the list which may not be loaded yet.
         * 230823 yky Created
         * 230826 yky Modified - Scrolls through the emojis and calls itself, if it cant load the emojis. Limited to 3 times
        */
        let emo = document.querySelector('[data-emoji="'+ emoji +'"]')
        if (emo == null)
        {
            ykAlert( 'Cant find the ' + emoji + ' emoji from the list' , 3)
            let animal = preloadEmojis()
            if ( (animal != null) && ( (loadedEmojis % 3) != 0 ) )
            {
                setTimeout( function () {clickEmoji_ClickMoreReaction( emoji )}, clickDelay*2.5 )
            }
            else
            {
                ykAlert( 'Tried loading ' + emoji + '. The grid will be stuck open till the next focusChat. #' + loadedEmojis, 0)
            }
        }
        else
        {
            emo.click()
            ykAlert( 'Clicked on "' + emoji + '" emoji ' + emo, 3)
        }
        return emo
    }
    function preloadEmojis()
    {
        // 230826 yky Created
        let animal = document.querySelector('[title="Animals & Nature"]')
        if (animal == null)
        {
            ykAlert( 'Emoji grid not loaded.', 0 )
            return null
        }
        ykAlert( 'Scrolling through all the emojis: #' + loadedEmojis, 5)
        let activity = document.querySelector('[title="Activity"]')
        let objects = document.querySelector('[title="Objects"]')
        let flags = document.querySelector('[title="Flags"]')
        animal.click()
        setTimeout( function () { activity.click() }, clickDelay*0.6 )
        setTimeout( function () { objects.click() }, clickDelay*1.2 )
        setTimeout( function () { flags.click() }, clickDelay*1.8 )
        loadedEmojis++
        return animal
    }
}

function eventFire(el, etype)
{
    /* Simulates an event on an element
     *   Mainly to click on the chatlist on the left
     *     https://stackoverflow.com/questions/58115835/chrome-console-click-not-working-on-chat-list-in-web-whatsapp
     * 230812 yky  Created. Works!
     */
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent(etype, true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
		el.dispatchEvent(evt);
}

function isEquation( equation )
{
    // 230812 yky  Created. Simple Equation validator.

    let hasEquals = (equation.indexOf("=") >= 0) || (equation.indexOf("equals") >= 0)
    let hasPlus = (equation.indexOf("+") >= 0) || (equation.indexOf("plus") >= 0)
    return hasEquals || hasPlus
}

function focusNewChat()
{
    /*  Cycles through potential Chats which need to be reviewed.
     *       Deprioritizes "You sent / reacted" for groups
     *       If it has a double check then isMe
     *  230812  yky  Created
     *  230823  yky  Modified - chats 'data-testid=cell-frame-container' changed
     *      last-msg-status changed, need to search by class now
     *  230824  yky  Modified - fixed class name for the last-msg-status to span.p357zi0d
     */
    //var chats = document.querySelectorAll("[data-testid='cell-frame-container']")
    //var chats = document.querySelectorAll("[role='listitem']")
    var chats = document.querySelectorAll("._199zF._3j691")
    var potentials = []
    var priority = []

    ykAlert('Focusing chats: ' + chats.length,4)

    for ( let chat of chats )
    {
        let author = chat.querySelector('[aria-label]')
        if (author != null) author = author.textContent
        else author = ""

        let message = chat.querySelector( "span.p357zi0d" )
        //let message = chat.querySelector("[data-testid='last-msg-status']")
        if (message != null)
        {
            let msg = message.textContent
            let isMe = (msg.indexOf("You:") == 0) || (msg.indexOf("You reacted ") == 0)
            let hasDoubleCheck = chat.querySelector( "[data-icon='status-dblcheck']" ) != null
            isMe = isMe || hasDoubleCheck
            let isUnread = chat.className.indexOf("_1KV7I") >= 0

            if (isEquation( msg ))
            {
                let item = [chat, author, msg, isMe]
                //ykAlert( "Slotting in :" + msg )
                if ((isMe) || (!isUnread)) potentials.push( item )
                else priority.push( item )
            }
        }
    }

    var selected = null

    ykAlert( 'Priority: ' + priority.length + ', Potentials: ' + potentials.length, 3)

    if (priority.length > 0)
    {
        selected = priority[ Math.floor( Math.random()*priority.length ) ]
    }
    else if (potentials.length > 0)
    {
        selected = potentials[ Math.floor( Math.random()*potentials.length ) ]
    }

    ykAlert( selected, 3 )

    if (selected != null)
    {
        let [chat, author, msg, isMe] = selected
        ykAlert( '"' + author + '" selected; "' + msg + '" ', 0 )
        eventFire( chat, "mousedown" )
    }
    return [priority, potentials]
}

/* ===================================== Reaction functions ============================ */

function respondToChat()
{
    /*  Main response loop
     *     Checks the Title
     *     Gets a list of the messages
     *     Reacts to the messages
     *     Checks if there are already responses, emojis etc.
     *  230702 yky Created
     *  230821 yky Modified = restructured to make it more robust
     */
    var texts = getChatTexts()
    var length = texts.length
    var responded = ""
    ykAlert( 'Trying to respond to ' + length + ' messages ', 4 )
    try
    {
        ykAlert("Messages: " + texts.length, 3 )

        var incomingTexts = []
        var hasResponded = false
        var isLastResponseMine = false
        var lastIncomingText = null
        var numBarriers = 1
        for (let i = length-1; i >=0; i--) // Loop to get incoming messages and status
        {
            let last = texts[ i ]
            let [datetime, author, isIncoming, message, hasEmoji, charEmoji, sentimentEmoji, span ] = last
            ykAlert( 'Last Msg: ' + message, 4)
            if (isIncoming)
            {
                if (lastIncomingText == null) lastIncomingText = last // Save this as the one to respond to
                if (numBarriers > 0)
                {
                    incomingTexts.push(last) // Store in the list of incoming.
                    ykAlert( 'Inserting Incoming ' + message, 5)
                }
            }
            else // (!isIncoming)
            {
                if (hasResponded || isLastResponseMine) break // Quit the loop if we have already given two responses.
                if (i == (length-1)) isLastResponseMine = true
                else numBarriers--
                hasResponded = true // Setting hasResponded for the first time to true
                ykAlert( 'Responded ' , 5)
            }
        }
        ykAlert( 'Found ' + incomingTexts.length + ' texts to reply to', 3)
        if (lastIncomingText != null)
        {
            let [datetime, author, isIncoming, message, hasEmoji, charEmoji, sentimentEmoji, span ] = lastIncomingText
            let command = message.toLowerCase()

            ykAlert("InMessage: " + message + ', hasResponded: ' + isLastResponseMine + ', emoji: ' + hasEmoji, 0 )
            if ( command == "maths" ) sendMessage( generateEquation() )
            else if ( command == "laugh" ) clickEmoji(span, 2)
            else
            {
                var [isEquation, lhs, equalsval, equalsverified, rateComplex] = parseEquation(message)
                if (isEquation)
                {
                    if (!hasEmoji)
                    {

                        let rate = -100
                        if (!isNaN(equalsval))
                        {
                            if (equalsval == equalsverified) rate = rateComplex
                            else rate = -50
                            currentdifficulty -= 3
                        }
                        ykAlert( 'Rating response: ' + rate + ' :' + [isEquation, lhs, equalsval, equalsverified], 5 )

                        clickEmoji(span, rate)
                        /*if (rate < -50) clickEmoji( span, 4 )
                        else if (rate < 0) clickEmoji( span, 3 )
                        else if (rate > 95) clickEmoji( span, 1 )
                        else if (rate > 40) clickEmoji( span, 0 )
                        else if (rate >= 0) clickEmoji( span, 5 )*/

                        if (!isLastResponseMine)
                        {
                            if (rate > 0)
                            {
                                ykAlert('Got the answer right, creating a new puzzle', 1)
                                responded = 'Correct! ' + message
                                setTimeout( function () { sendMessage( generateEquation(100) ) }, clickDelay*4 )
                            } else // wrong answer.
                            {
                                if ( incomingTexts.length > 3 )
                                {
                                    ykAlert( 'Tried answering 3 times. Giving another puzzle', 0 )
                                    responded = "Try a new one"
                                    sendMessage( generateEquation(-100) )
                                }
                            }
                        }

                    } else // Has Emoji
                    {
                        if ((equalsval == equalsverified) && !isLastResponseMine)
                        {
                            ykAlert('Reacted, but no response', 1)
                            responded = "Giving a new one"
                            sendMessage( generateEquation(100) )
                        }
                    }
                } // end of isEquation
            }
        }

    } catch(err) {
        ykAlert( err.message, -1 )
    }
    if (responded != "") ykAlert('Responded with: ' + responded, 2)
    else ykAlert( 'No message to respond', 2 )

    return [ hasResponded, isLastResponseMine, lastIncomingText, responded, incomingTexts, texts]
}

function heartBeat()
{
	/* Heartbeat function to periodically check for new chats
	 *    And prepare the potential responses every ~20 secs
	 *    Calls itself after 1min.
	 *    Suicides if window.heartBeatTimeout == -1
	 * 230815 Created yky
	 */
    if (document.heartBeatTimeout == -1)
    {
        ykAlert( 'Heart Stopped', 0 )
        return 0
    }
    ykAlert('Heart Beat ... ', 4)
    document.heartBeatTimeout = setTimeout( function () { heartBeat() }, 60000 )
    document.chatList = focusNewChat()
    setTimeout( function () { document.chatResponse = respondToChat() }, 7000 )
    setTimeout( function () { document.chatResponse = respondToChat() }, 26000 )
    setTimeout( function () { document.chatResponse = respondToChat() }, 45000 )
}

ykAlert('Starting AhKuKalc Heartbeat', 0)

var heartBeatTimeout = setTimeout( function () { heartBeat() }, 10000 ) // 230812 yky Run this after loadup
document.heartBeatTimeout = heartBeatTimeout
