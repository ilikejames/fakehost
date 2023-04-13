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
    Task ClientToServerStreaming(ChannelReader<ClientItem> stream);
    Task<IEnumerable<string>> GetUploaded();
 
}

[TranspilationSource]
public record ClientItem(string Content);

