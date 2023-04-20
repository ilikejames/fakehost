using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading.Channels;
using System.Threading.Tasks;
using TestSignalr.Interfaces;

namespace TestSignalr.Hub;

public class TimeStreamHub : Hub<ITimeStreamHub>, ITimeStreamHub
{
    private readonly ILogger _logger;
    private static readonly ConcurrentDictionary<string, string[]> Uploaded = new();

    public TimeStreamHub(ILogger<TimeStreamHub> logger)
    {
        _logger = logger;
    }

    public async Task<ChannelReader<DateTime>> StreamTimeAsync(
        int intervalSeconds,
        [EnumeratorCancellation]
        CancellationToken cancellationToken
    )
    {
        _logger.Log(LogLevel.Information, "{id}: Invoke StreamTimeAsync", this.Context.ConnectionId);

        var channel = Channel.CreateUnbounded<DateTime>();

        // Start a new task to generate the time stream and write to the channel
        _ = Task.Run(async () =>
        {
            while (true)
            {
                await Task.Delay(intervalSeconds * 1000);

                cancellationToken.ThrowIfCancellationRequested();

                _logger.Log(LogLevel.Information, "{id}: Emitting StreamTimeAsync", this.Context.ConnectionId);

                var currentTime = DateTime.Now;
                await channel.Writer.WriteAsync(currentTime);
            }
        });

        return channel.Reader;
    }

    public async Task ClientToServerStreaming(ChannelReader<ClientItem> stream)
    {
        _logger.Log(LogLevel.Information, "{id}: Invoke ClientToServerStreaming", this.Context.ConnectionId);
        await foreach (var item in stream.ReadAllAsync())
        {
            _logger.Log(LogLevel.Information, "{id}: ClientToServerStreaming Item {item}", this.Context.ConnectionId, item.Content);
            
            var newArray = Uploaded.AddOrUpdate(
                this.Context.ConnectionId,
                key => new[] { item.Content },
                (key, existingArray) => existingArray.Append(item.Content).ToArray()
            );

            Uploaded.TryUpdate(this.Context.ConnectionId, newArray, Uploaded[this.Context.ConnectionId]);
        }
    }

    public Task<IEnumerable<string>> GetUploaded()
    {
        _logger.Log(LogLevel.Information, "{id}: Invoke GetUploaded", this.Context.ConnectionId);
        var uploaded = Uploaded.GetOrAdd(this.Context.ConnectionId, _ => new string[0]);
        return Task.FromResult(uploaded as IEnumerable<string>);
    }


    public async Task<ChannelReader<string>> AlwaysErrors() 
    {
        throw new InvalidOperationException("This method always throws an error.");
    }

    public async Task<ChannelReader<string>> AlwaysErrorsOnTheSecondEmit()
    {
        var channel = Channel.CreateUnbounded<string>();

        _ = WriteItemsAsync(channel.Writer);

        return channel.Reader;

        async Task WriteItemsAsync(ChannelWriter<string> writer)
        {
            try
            {
                await writer.WriteAsync("first");
                await Task.Delay(TimeSpan.FromSeconds(1));

                // Throw an error after 1 second
                throw new InvalidOperationException("This method always throws an error on the second emit.");
            }
            catch (Exception ex)
            {
                // Complete the writer with the exception to propagate the error to the client
                writer.Complete(ex);
            }
        }
    }
}
