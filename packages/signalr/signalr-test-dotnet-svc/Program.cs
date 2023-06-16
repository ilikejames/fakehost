using TestSignalr.Hub;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR().AddMessagePackProtocol();
builder.Services.AddSingleton<OrderService>();
// Use the AddHostedService overload that accepts a factory delegate
builder.Services.AddSingleton<IOrderService, OrderService>(sp => sp.GetRequiredService<OrderService>());
builder.Services.AddSingleton<IHostedService, OrderService>(sp => sp.GetRequiredService<OrderService>());

builder.Services.AddHostedService(sp => sp.GetRequiredService<OrderService>());


var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapHub<ChatHub>("/chathub");
app.MapHub<TimeStreamHub>("/timehub");
app.MapHub<OrderHub>("/orderhub");


app.Run();
