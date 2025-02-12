let set = document.querySelectorAll(".btn");

set.forEach(e => {
    e.addEventListener("mousedown", () => {
        e.style.filter = "brightness(1.2)";
    });

    document.addEventListener("mouseup", () => {
        e.style.filter = "";
    });
});


// Backend Logic

alert("Welcome!");

let nums = document.querySelectorAll(".btn");

let count = 1;

function main(){

    try {

        box.textContent = box.textContent.replace("÷", "/");

        box.textContent = box.textContent.replace("×", "*");

        box.textContent = box.textContent.replace("^", "**");

        arr.forEach(e => {

            box.textContent = box.textContent.replace(`${e}sin(`, `${e}*sin(`);

            box.textContent = box.textContent.replace(`${e}cos(`, `${e}*cos(`);

            box.textContent = box.textContent.replace(`${e}tan(`, `${e}*tan(`);

            box.textContent = box.textContent.replace(`${e}log(`, `${e}*log(`);
        });

        box.textContent = box.textContent.replace("sin(", "Math.sin((Math.PI/180)*");

        box.textContent = box.textContent.replace("cos(", "Math.cos((Math.PI/180)*");

        box.textContent = box.textContent.replace("tan(", "Math.tan((Math.PI/180)*");

        box.textContent = box.textContent.replace("log(", "Math.log10(");

        box.textContent = eval(box.textContent);

        if(box.textContent.includes("Math.tan((Math.PI/180)*90") || box.textContent.includes("Math.tan((Math.PI/180)*270")){

            box.textContent = "Infinity";
        }

        if(Math.abs(box.textContent) < 1e-10){
            box.textContent = 0;
        }

        if(box.textContent.length > 12){

            box.textContent = parseFloat((box.textContent)).toExponential(7);
        }

    } catch (error) {

        alert("Invalid Input Detected!");

        box.textContent = "";
    }
}

nums.forEach(e => {
    e.addEventListener("click", () => {

        if (e.classList.contains("num") == true || e.classList.contains("bracket") == true || e.classList.contains("dot") == true || e.classList.contains("opr") == true) {

            box.append(e.textContent);
        }

        else if (e.classList.contains("C") == true) {

            box.textContent = box.textContent.slice(0, -1);
        }

        else if (e.classList.contains("CE") == true) {

            box.textContent = "";
        }

        else if (e.classList.contains("sin") == true || e.classList.contains("cos") == true || e.classList.contains("tan") == true){

            box.append(e.textContent + "(");
            if(count==1){

                alert("Enter angle in degrees!");
            }
            count++;
        }

        else if(e.classList.contains("log") == true){

            box.append(e.textContent + "(");
        }
    });
});

let box = document.querySelector(".box");

document.addEventListener("keydown", (event) => {

    if(event.key=="Backspace" || event.key=="Delete"){

        box.textContent = box.textContent.slice(0, -1);
    }

    else if(event.key=="*"){

        box.append("×");
    }

    else if(event.key=="/"){

        box.append("÷");
    }

    else if(event.key=="=" || event.key=="Enter"){

        main();
    }

    nums.forEach(e => {

        if (e.textContent == event.key) {

            box.append(event.key);
        }
    });
});

let arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, ")"];

document.querySelector(".equal").addEventListener("click", () => {

    main();
});