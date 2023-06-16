using System;
using System.Collections.Generic;
using System.Threading.Channels;
using System.Threading.Tasks;
using Tapper;
using TypedSignalR.Client;

namespace TestSignalr.Interfaces;

[Hub]
public interface IOrderHub
{
    Task<ChannelReader<Order>> GetAllOrders();
    Task<ChannelReader<OrderUpdate>> OrderStream();
}

[TranspilationSource]
public enum OrderStatus
{
    Open,
    Partial,
    Filled,
}

[TranspilationSource]
public class EndOfStream
{
}

#pragma warning disable CS8618 // Disable the warning

[TranspilationSource]
public class Order
{
    public long orderId { get; set; }
    public decimal price { get; set; }
    public decimal totalQuantity { get; set; }
    public decimal filledQuantity { get; set; }
    public string symbol { get; set; }
    public OrderStatus status { get; set; }
}

[TranspilationSource]
public class OrderUpdate
{
    public string action { get; set; }
    public Order order { get; set; }

    public OrderUpdate() {
        order = new Order();
        action = string.Empty;
    }
}

#pragma warning restore CS8618 // Restore the warning
