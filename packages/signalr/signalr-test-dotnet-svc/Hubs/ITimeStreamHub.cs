using System;
using System.Collections.Generic;
using System.Threading.Channels;
using System.Threading.Tasks;
using Tapper;
using TypedSignalR.Client;

namespace TestSignalr.Interfaces;

[Hub]
public interface ITimeStreamHub
{
    Task<ChannelReader<DateTime>> StreamTimeAsync(int intervalSeconds, CancellationToken cancellationToken);
    Task ClientToServerStreaming(ChannelReader<string> stream);
    Task<IEnumerable<string>> GetUploaded();
    Task<ChannelReader<string>> AlwaysErrors();
    Task<ChannelReader<string>> AlwaysErrorsOnTheSecondEmit();
}
