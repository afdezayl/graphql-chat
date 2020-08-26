import {
  ApolloClient,
  ApolloProvider,
  gql,
  HttpLink,
  InMemoryCache,
  split,
  useMutation,
  useQuery,
} from '@apollo/client';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from 'apollo-utilities';
import React, { Component } from 'react';
import { Button, Col, Container, FormInput, Row } from 'shards-react';
import './chat.scss';

type Message = {
  id: number;
  content: string;
  user: string;
};

interface MessagesData {
  messages: Array<Message>;
}

interface NewMessageData {
  messageAdded: Message;
}

const httpLink = new HttpLink({
  uri: '/graphql',
});

const wsLink = new WebSocketLink({
  uri: `ws://localhost:3333/graphql`,
  options: {
    reconnect: true,
  },
});

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

const GET_MESSAGES = gql`
  query {
    messages {
      id
      content
      user
    }
  }
`;

const MESSAGE_ADDED = gql`
  subscription {
    messageAdded {
      id
      user
      content
    }
  }
`;

const POST_MESSAGE = gql`
  mutation($user: String!, $content: String!) {
    postMessage(data: { content: $content, user: $user })
  }
`;

interface MessageProps {
  messages: Array<Message>;
  user: string;
  subscribeToNewMessages: () => unknown;
}
class MessagesView extends Component<MessageProps> {
  componentDidMount() {
    this.props.subscribeToNewMessages();
  }
  render() {
    return (
      <>
        {this.props.messages.map(({ id, user: messageUser, content }) => (
          <div
            key={id}
            style={{
              display: 'flex',
              justifyContent:
                this.props.user === messageUser ? 'flex-end' : 'flex-start',
              paddingBottom: '1em',
            }}
          >
            {this.props.user !== messageUser && (
              <div className="message-sender">
                {messageUser.slice(0, 3).toUpperCase()}
              </div>
            )}
            <div
              className={`message ${
                this.props.user === messageUser ? 'self-message' : ''
              }`}
            >
              {content}
            </div>
          </div>
        ))}
      </>
    );
  }
}

const MessagesData = ({ user }) => {
  const { data, loading, error, subscribeToMore } = useQuery<MessagesData>(
    GET_MESSAGES
  );
  const onNewMessage = () =>
    subscribeToMore<NewMessageData>({
      document: MESSAGE_ADDED,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) {
          return prev;
        }
        const newMessage = subscriptionData.data.messageAdded;

        return Object.assign({}, prev, {
          messages: [...prev.messages, newMessage],
        });
      },
    });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>error.message</div>;

  return (
    <MessagesView
      user={user}
      messages={data.messages}
      subscribeToNewMessages={onNewMessage}
    ></MessagesView>
  );
};

const Chat = () => {
  const [state, stateSet] = React.useState({
    user: 'abc',
    content: '',
  });
  const [postMessage] = useMutation(POST_MESSAGE);

  const onSend = () => {
    if (state.content.length > 0) {
      postMessage({ variables: state });
    }
    stateSet({
      ...state,
      content: '',
    });
  };
  return (
    <Container>
      <MessagesData user={state.user} />
      <Row>
        <Col xs={2} style={{ padding: 0 }}>
          <FormInput
            label="User"
            value={state.user}
            onChange={(evt) =>
              stateSet({
                ...state,
                user: evt.target.value,
              })
            }
          />
        </Col>
        <Col xs={8}>
          <FormInput
            label="Content"
            value={state.content}
            onChange={(evt) =>
              stateSet({
                ...state,
                content: evt.target.value,
              })
            }
            onKeyUp={(evt) => {
              if (evt.keyCode === 13) {
                onSend();
              }
            }}
          />
        </Col>
        <Col xs={2} style={{ padding: 0 }}>
          <Button onClick={() => onSend()} style={{ width: '100%' }}>
            Send
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default () => (
  <ApolloProvider client={client}>
    <Chat />
  </ApolloProvider>
);
