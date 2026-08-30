type InputFieldProps = {
  label: string;
  type?: string;
  name: string;
  register: any;
  defaultValue?: any;
  error?: any;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  registerOptions?: object;
  width?: string;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  registerOptions,
  width = "md:w-1/4",
}: InputFieldProps) => {
  const isNumberInput = type === "number";

  return (
    <div className={hidden ? "hidden" : `flex flex-col gap-2 w-full ${width}`}>
      <label className="text-xs text-gray-500">{label}</label>

      <input
        type={type}
        {...register(name, registerOptions)}
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...inputProps}
        defaultValue={defaultValue}
        onWheel={(e) => {
          if (isNumberInput) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.blur();
          }
        }}
      />

      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
