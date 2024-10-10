using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Threading.Channels;
using System.Threading.Tasks;
using System.Reactive;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using TestSignalr.Interfaces;


namespace TestSignalr.Hub;


public interface IOrderService
{
    Task<List<Order>> GetAllOrders();
    IObservable<OrderUpdate> OrderStream();
}

public class OrderService : IOrderService, IHostedService, IDisposable
{
    private List<Order> _orders = new List<Order>();
    private readonly Subject<OrderUpdate> _orderUpdateSubject = new Subject<OrderUpdate>();
    private readonly CancellationTokenSource _cancellationTokenSource = new CancellationTokenSource();

    public OrderService()
    {
    }
    
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // Start the background task and return immediately
        _ = CreateOrdersInBackground(cancellationToken);
        await Task.Delay(100); // Give the background task a chance to start
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        System.Console.WriteLine("OrderService.StopAsync");

        _cancellationTokenSource.Cancel();
        return Task.CompletedTask;
    }

    public async Task<List<Order>> GetAllOrders()
    {
         System.Console.WriteLine($"GetAllOrders called, total orders: {_orders.Count}");
        return await Task.FromResult(_orders);
    }

    public IObservable<OrderUpdate> OrderStream()
    {
        return _orderUpdateSubject.AsObservable();
    }

    private async Task CreateOrdersInBackground(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            var order = new Order
            {
                orderId = new Random().Next(1, int.MaxValue),
                price = new Random().Next(1, 100),
                totalQuantity = new Random().Next(1, 100),
                filledQuantity = 0,
                symbol = "BTC",
                status = OrderStatus.Open
            };

      
            _orders.Add(order);
            _orderUpdateSubject.OnNext(new OrderUpdate { action = "create", order = order });

            System.Console.WriteLine($"Order added: {order.orderId}, total orders: {_orders.Count}");

            await Task.Delay(300);

            for (int i = 0; i < 5; i++)
            {
                order.filledQuantity = (int)order.filledQuantity + 1 < (int)order.totalQuantity 
                    ? new Random().Next((int)order.filledQuantity + 1, (int)order.totalQuantity) 
                    : (int)order.totalQuantity;

                if(order.filledQuantity > 0) {
                    order.status = OrderStatus.Partial;   
                }
                if(order.filledQuantity == order.totalQuantity) {
                    order.status = OrderStatus.Filled;
                }

                _orderUpdateSubject.OnNext(new OrderUpdate { action = "update", order = order });
                await Task.Delay(600);
            }
        }
    }

    public void Dispose()
    {
        _cancellationTokenSource.Cancel();
        _orderUpdateSubject.Dispose();
    }
}


public class OrderHub : Hub<IOrderHub>, IOrderHub
{
    private readonly IOrderService _orderService;

    public OrderHub(IOrderService hubService)
    {
        _orderService = hubService;
    }

    public async Task<ChannelReader<Order>> GetAllOrders()
    {
        var orders = await _orderService.GetAllOrders();
        System.Console.WriteLine($"GetAllOrders: {orders.Count}");
        var channel = Channel.CreateUnbounded<Order>();

        _ = Task.Run(async () =>
        {
            foreach (var order in orders)
            {
                await channel.Writer.WriteAsync(order);
            }

            channel.Writer.Complete();

        });

        return channel.Reader;
    }

    private static async IAsyncEnumerable<OrderUpdate> ConvertToAsyncEnumerable(IObservable<OrderUpdate> observable)
    {
        var channel = Channel.CreateUnbounded<OrderUpdate>();
        using (observable.Subscribe(update => channel.Writer.TryWrite(update), () => channel.Writer.TryComplete()))
        {
            await foreach (var update in channel.Reader.ReadAllAsync())
            {
                yield return update;
            }
        }
    }

    public async Task<ChannelReader<OrderUpdate>> OrderStream()
    {
        var orderStream = _orderService.OrderStream();
        var channel = Channel.CreateUnbounded<OrderUpdate>();

        _ = Task.Run(async () =>
        {
            await foreach (var update in ConvertToAsyncEnumerable(orderStream))
            {
                await channel.Writer.WriteAsync(update);
            }
        });

        await Task.CompletedTask;
        return channel.Reader;
    }
}
