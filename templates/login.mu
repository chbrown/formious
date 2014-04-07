<div style="width: 200px; margin: 80px auto; background-color: white" class="shadow">
  <form method="POST" style="padding: 10px">
    <h3>Admin Login</h3>
    <p style="font-size: 80%"><% message %></p>
    <label>
      <div><b>Email</b></div>
      <input name="email" value="<% email %>" style="width: 100%;">
    </label>
    <label>
      <div><b>Password</b></div>
      <input type="password" name="password" value="<% password %>" style="width: 100%;">
    </label>
    <p>
      <button>Login</button>
    </p>
  </form>
</div>
