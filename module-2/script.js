
let card = document.getElementById("card");
let result = document.getElementById("result");
let input = document.getElementById("username");

card.addEventListener("submit", ( async e => {
    e.preventDefault();
    await main();
}))

async function main() {
    const username = input.value.trim();

    if (username === "") {
        showError("⚠️ Please enter a GitHub username.");
        return;
    }  

    try {
        let data = await getData(`https://api.github.com/users/${username}`);

        if(data.message === "Not Found") {
            throw new Error("❌ User not found.");
        }
        displayUser(data);
    } catch (error) {
        showError(error.message);
    }

}

function displayUser(user) {
    result.innerHTML = `
            <div class="profile">
                <img src="${user.avatar_url}" alt="Profile Picture">
                <h2>${user.name || user.login}</h2>
                <p>${user.bio || "📜 No bio available."}</p>
                <p><strong>📂 Public Repositories:</strong> ${user.public_repos}</p>
                <p><strong>👥 Followers:</strong> ${user.followers}</p>
                <p><strong>🔗 Following:</strong> ${user.following}</p>
                <a href="${user.html_url}" target="_blank" class="link">🔎 View Profile</a>
            </div>
        `;
}

function showError(message) {
    result.innerHTML = `<p class="error">${message}</p>`;
}

async function getData(link) {
    try{
        let info = await fetch(link);
        if(info.ok==false) {
            throw new Error("❌ Failed to fetch data.")
        }
        let data = await info.json();
        return data;
    }
    catch(err) {
        throw new Error("🚨 Network error! Please check your connection.");
    }
}

document.addEventListener("DOMContentLoaded", ()=> {
    particlesJS("particles-js", {
        particles: {
            number: { value: 200 },
            size: { value: 3 },
            move: { speed: 2 },
            line_linked: { enable: true, opacity: 0.5 },
        }
    });
})
