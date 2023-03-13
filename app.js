const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const db = require("better-sqlite3")("fotballigaen.db", {verbose: console.log});
const hbs = require ("hbs");
const app = express();



const viewPath = path.join(__dirname, "/views/pages")
const partialsPath = path.join(__dirname, "/views/partials")
app.set("view engine", hbs)
app.set('views',viewPath)
hbs.registerPartials(partialsPath)


//rendrer alle hbs sidene

function adminSideroute(request, response){
    
    response.render("admin.hbs")

}
function tabellSideroute(request, response){
    response.render("tabell.hbs")
}

function predictionSideroute(request, response){
    response.render("predictions.hbs")
}

function slettmegSideroute(request, response){
    response.render("slettmeg.hbs")
}

app.use(session({
    secret: "Einlangstringsombørveretilfeldiggenerertoglagratdidotenv",
    resave: false,
    saveUninitialized: false //Ved false settes ikke cookie (med sessionID) før en evt gjør endringer i sesjonen
})) 
app.use(express.urlencoded({extended: true}))



//henter registreringsfilene
app.get("/registrer", (req, res) => {
    res.sendFile(path.join(__dirname, "/registrer.html"))
})

//Henter html filene
app.get("/", (req, res) => {
    if(req.session.loggedin) {
        res.sendFile(path.join(__dirname, "/index.html"))
    } else {
        res.sendFile(path.join(__dirname, "/login.html"))
    }    
})

//logg inn posten
app.post("/login", async (req, res) => {
    let login = req.body;

    let users = db.prepare("SELECT * FROM users WHERE username = ?").get(login.username);
    
    if(await bcrypt.compare(login.password, users.password)) {
        req.session.loggedin = true
        req.session.brukerid= users.id
        res.redirect("/")
    } else {
        res.redirect("back")
    }
})

function logout() {
    document.cookie = "user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "login.html";
}

//app post som lar deg logge ut
app.post('/logout', (req, res) => {
    req.session.destroy((err) => { 
        if(err) {
            console.log(err);
        } else {
            res.redirect('/') 
        }
    });
});
app.post(("/adduser"), async (req, res) =>{
    let svar = req.body;

    let hash = await bcrypt.hash(svar.password, 10)
    console.log(svar)
    console.log(hash)

    db.prepare("INSERT INTO users(username, password) VALUES (?, ?)").run(svar.username, hash)
    
    res.redirect("/")
})

// Konfigurer Express Handlebars som standard-view-engine



  
app.get('/admin', (req, res) => {
    const users = db.prepare("SELECT users.id, users.username, users.points, teams.team_name FROM users LEFT JOIN predictions ON users.id = predictions.user_id LEFT JOIN teams ON predictions.predicted_winner_id = teams.id").all()
    const teams = db.prepare("SELECT * FROM teams").all()
    const points = db.prepare("SELECT * FROM POINTS").all()
    const predictions = db.prepare("SELECT predictions.predicted_winner_id, teams.team_name FROM teams JOIN predictions ON teams.id = predictions.predicted_winner_id").all()

      let data = {
        
      }

      data["users"] = users
      data["teams"] = teams
      data["points"] = points
      data["prediction"] = predictions

      

      //console.log(data)
  
      res.render('admin.hbs', data);

    
  });

  app.get("/deluser", (req, res) => {
    console.log(req.query.i)
    let id = req.query.i
    db.prepare("DELETE FROM users WHERE id = ?").run(id)
    db.prepare("DELETE FROM predictions WHERE id = ?").run(id)

    res.redirect("back")
  })

  


  app.post("/points",async (req, res) =>{
    let poengsvar = req.body.points;
    let id = req.body.id

    db.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(poengsvar, id)
    res.redirect("back")
  })

  app.get('/tabell', (req, res) => {
    const users = db.prepare("SELECT * FROM users").all()
    const points = db.prepare("SELECT * FROM POINTS").all()
      let data = {
        
      }

      data["users"] = users
      data["points"] = points

      //console.log(data)

      
      res.render('tabell.hbs', data);

      
    

    
  });
  
  //rendrer prediction siden
  app.get('/predictions', (req, res) => {
    const teams = db.prepare("SELECT * FROM teams").all()
    let data = {teams: teams}

    res.render('predictions.hbs', data);

      
    

    
  });

  //Hver bruker lagrer sin prediction
  app.post("/prediction",async (req, res) =>{
    let svar = req.body;
    db.prepare("INSERT INTO predictions(predicted_winner_id, user_id) VALUES (?,?)").run(req.body.Lag, req.session.brukerid)
  });
 

  app.get("/slettmeg", (req, res) =>{
   
    res.render('slettmeg.hbs');
  })


  //En post som lar deg slettebrukerene
  app.post("/delete",async (req, res)=>{
    let svar = req.body;
    console.log("Hit")
    console.log(req.session)
    db.prepare("DELETE FROM users WHERE id = ?").run(req.session.brukerid)
    db.prepare("DELETE FROM predictions WHERE id = ?").run(req.session.brukerid)
    req.session.destroy();
    res.redirect("/")


  })



app.listen("3000", () => {
    console.log("Server listening at http://localhost:3000")
})


//SELECT points FROM points WHERE user_id = 7 ORDER BY id DESC LIMIT 1;
