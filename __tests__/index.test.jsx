const { fireEvent, render } = require('@testing-library/react');
const React = require('react');

const { Variable, VARIABLE_REGEXP, MDX_VARIABLE_REGEXP } = require('../index');

describe('single variable', () => {
  const props = {
    variable: 'apiKey',
    user: { apiKey: '123456' },
    defaults: [],
    changeSelected: () => {},
    selected: '',
  };

  it('should render value', () => {
    const { container } = render(<Variable {...props} />);

    expect(container).toHaveTextContent('123456');
  });

  it('should not fail if `defaults` has null entries', () => {
    const { container } = render(<Variable {...props} defaults={[null]} />);

    expect(container).toHaveTextContent('123456');
  });

  it('should render default if value not set', () => {
    const { container } = render(<Variable {...props} defaults={[{ name: 'apiKey', default: 'default' }]} user={{}} />);

    expect(container).toHaveTextContent('default');
  });

  it('should render uppercase if no value and no default', () => {
    const { container } = render(<Variable {...props} defaults={[]} user={{}} />);

    expect(container).toHaveTextContent('APIKEY');
  });

  it('should allow the use of "name" as a prop', () => {
    const { variable, ...rest } = props;
    const { container } = render(<Variable {...rest} name="apiKey" />);

    expect(container).toHaveTextContent('123456');
  });

  it('should render auth dropdown if default and oauth enabled', () => {
    const { container } = render(
      <Variable {...props} defaults={[{ name: 'apiKey', default: 'default' }]} oauth user={{}} />,
    );

    fireEvent.click(container.querySelector('.variable-underline'));

    expect(container.querySelectorAll('#loginDropdown')).toHaveLength(1);
  });

  it('should render auth dropdown if no default and oauth enabled', () => {
    const { container } = render(<Variable {...props} defaults={[]} oauth user={{}} />);

    fireEvent.click(container.querySelector('.variable-underline'));

    expect(container.querySelectorAll('#loginDropdown')).toHaveLength(1);
  });

  it.todo('should set `selected` if nothing is selected');

  it('should render objects as strings', () => {
    const { container } = render(<Variable {...props} user={{ apiKey: { renderTo: 'string' } }} />);

    expect(container).toHaveTextContent(JSON.stringify({ renderTo: 'string' }));
  });
});

describe('multiple variables', () => {
  const props = {
    variable: 'apiKey',
    user: {
      keys: [
        { name: 'project1', apiKey: '123' },
        { name: 'project2', apiKey: '456' },
      ],
    },
    defaults: [],
    selected: '',
    changeSelected: () => {},
  };

  it('should not fail if user has `keys` but its empty', () => {
    const p = {
      ...props,
      user: {
        keys: [],
      },
    };

    const { container } = render(<Variable {...p} />);
    expect(container).toHaveTextContent('APIKEY');
  });

  it('should render the first of multiple values', () => {
    const { container } = render(<Variable {...props} />);

    expect(container).toHaveTextContent('123');
  });

  it('should render whatever the selected name is', () => {
    const { container } = render(<Variable {...props} selected="project2" />);

    expect(container).toHaveTextContent('456');
  });

  it('should show dropdown when clicked', () => {
    const { container } = render(<Variable {...props} selected="project2" />);

    fireEvent.click(container.querySelector('.variable-underline'));

    const options = [];
    container.querySelectorAll('select option').forEach(tk => {
      options.push(tk.text);
    });

    expect(options).toStrictEqual(['project1', 'project2']);
  });

  it('should select value when clicked', () => {
    const changeSelected = jest.fn();

    const { container } = render(
      <Variable
        {...props}
        changeSelected={changeSelected}
        selected="project1"
        user={{
          keys: [{ name: 'project1', apiKey: '123' }, { name: 'project2', apiKey: '456' }, { name: 'project3' }],
        }}
      />,
    );

    fireEvent.click(container.querySelector('.variable-underline'));
    fireEvent.change(container.querySelector('select'), {
      target: {
        value: container.querySelectorAll('select option')[1].text,
      },
    });

    expect(changeSelected).toHaveBeenCalledWith('project2');

    expect(container.querySelector('select')).not.toBeInTheDocument();
  });

  it('should render from the top level if not set', () => {
    const { container } = render(
      <Variable
        {...props}
        user={{
          topLevelProperty: 'this is coming straight from the top',
          keys: [{ name: 'project1', apiKey: '123' }],
        }}
        variable={'topLevelProperty'}
      />,
    );

    expect(container).toHaveTextContent('this is coming straight from the top');

    // Should not show the selected dropdown when clicked
    fireEvent.click(container.querySelector('.variable-underline'));
    expect(container.querySelector('select')).not.toBeInTheDocument();
  });

  it('should render the default if not set', () => {
    const { container } = render(
      <Variable
        {...props}
        defaults={[{ name: 'testDefault', default: 'this is a default value' }]}
        variable={'testDefault'}
      />,
    );

    expect(container).toHaveTextContent('this is a default value');

    // Should not show the selected dropdown when clicked
    fireEvent.click(container.querySelector('.variable-underline'));
    expect(container.querySelector('select')).not.toBeInTheDocument();
  });

  it('should not show a dropdown if there is only one option', () => {
    const { container } = render(<Variable {...props} user={{ keys: [{ name: 'project1', apiKey: '123' }] }} />);

    // Should not show the selected dropdown when clicked
    fireEvent.click(container.querySelector('.variable-underline'));
    expect(container.querySelector('select')).not.toBeInTheDocument();
  });

  it.todo('should render auth dropdown if default and oauth enabled');
});

describe('VARIABLE_REGEXP', () => {
  it('should match against periods', () => {
    expect('<<api.key>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match against hyphens', () => {
    expect('<<api-key>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match against spaces', () => {
    expect('<<api key>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match against colons', () => {
    expect('<<glossary:term>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match against underscores', () => {
    expect('<<api_key>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should be case insensitive', () => {
    expect('<<api.KeY>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match numeric characters', () => {
    expect('<<P2P>>').toMatch(new RegExp(VARIABLE_REGEXP));
    expect('<<123>>').toMatch(new RegExp(VARIABLE_REGEXP));
    expect('<<glossary:123>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match non-english characters', () => {
    expect('<<片仮名>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should match against colons with non-english characters', () => {
    expect('<<glossary:ラベル>>').toMatch(new RegExp(VARIABLE_REGEXP));
  });

  it('should NOT match against newlines', () => {
    expect('<<what the\nfuck>>').not.toMatch(new RegExp(VARIABLE_REGEXP));
    expect('<<what the\rfuck>>').not.toMatch(new RegExp(VARIABLE_REGEXP));
    expect('<<what the\r\nfuck>>').not.toMatch(new RegExp(VARIABLE_REGEXP));
  });
});

describe('MDX_VARIABLE_REGEXP', () => {
  it('should **not** match against periods', () => {
    expect('{user.api.key}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should **not** match against hyphens', () => {
    expect('{user.api-key}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should **not** match against spaces', () => {
    expect('{user.api key}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should **not match against colons', () => {
    expect('{user.glossary:term}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should match against underscores', () => {
    expect('{user.api_key}').toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should be case insensitive', () => {
    expect('{user.apiKeY}').toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should match non-leading numeric characters', () => {
    expect('{user.P2P}').toMatch(new RegExp(MDX_VARIABLE_REGEXP));
    expect('{user.123}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
    expect('{user.A123}').toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should match non-english characters', () => {
    expect('{user.片仮名}').toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });

  it('should NOT match against newlines', () => {
    expect('{user.what_the\nfuck}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
    expect('{user.what_the\rfuck}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
    expect('{user.what_the\r\nfuck}').not.toMatch(new RegExp(MDX_VARIABLE_REGEXP));
  });
});
