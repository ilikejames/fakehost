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
    Filled
}

[TranspilationSource]
public class EndOfStream
{
}

#pragma warning disable CS8618 // Disable the warning

[TranspilationSource]
public class Order
{
    public long OrderId { get; set; }
    public decimal Price { get; set; }
    public decimal TotalQuantity { get; set; }
    public decimal FilledQuantity { get; set; }
    public string Symbol { get; set; }
    public OrderStatus Status { get; set; }
}

[TranspilationSource]
public class OrderUpdate
{
    public string Action { get; set; }
    public Order Order { get; set; }

    public OrderUpdate() {
        Order = new Order();
        Action = string.Empty;
    }
}

#pragma warning restore CS8618 // Restore the warning
